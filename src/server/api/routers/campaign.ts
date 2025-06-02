import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Validation schemas
const campaignStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]);

const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  budget: z.number().int().min(1, "Budget must be at least $1"),
  startDate: z.date(),
  endDate: z.date(),
  niches: z.array(z.string()).min(1, "At least one niche is required"),
  location: z.string().optional(),
  minFollowers: z.number().int().min(0).optional(),
  maxFollowers: z.number().int().min(0).optional(),
});

const updateCampaignSchema = createCampaignSchema.extend({
  id: z.string(),
  status: campaignStatusSchema.optional(),
});

export const campaignRouter = createTRPCRouter({
  // Create a new campaign
  create: protectedProcedure
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is a brand
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      // if (user?.role !== "BRAND") {
      //   throw new Error("Only brands can create campaigns");
      // }

      // Validate date logic
      if (input.endDate <= input.startDate) {
        throw new Error("End date must be after start date");
      }

      // Validate follower range
      if (
        input.minFollowers &&
        input.maxFollowers &&
        input.minFollowers > input.maxFollowers
      ) {
        throw new Error(
          "Minimum followers cannot be greater than maximum followers",
        );
      }

      return await ctx.db.campaign.create({
        data: {
          ...input,
          brandId: ctx.session.user.id,
        },
        include: {
          brand: {
            select: {
              name: true,
              brandProfile: true,
            },
          },
        },
      });
    }),

  // Get all campaigns for the current brand
  getMyBrandCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });

    // if (user?.role !== "BRAND") {
    //   throw new Error("Only brands can view their campaigns");
    // }

    return await ctx.db.campaign.findMany({
      where: { brandId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        brand: {
          select: {
            name: true,
            brandProfile: true,
          },
        },
      },
    });
  }),

  // Get a single campaign by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          brand: {
            select: {
              name: true,
              brandProfile: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Check if user owns this campaign or is viewing as creator
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role === "BRAND" && campaign.brandId !== ctx.session.user.id) {
        throw new Error("You can only view your own campaigns");
      }

      return campaign;
    }),

  // Update a campaign
  update: protectedProcedure
    .input(updateCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check ownership
      const existingCampaign = await ctx.db.campaign.findUnique({
        where: { id },
      });

      if (!existingCampaign) {
        throw new Error("Campaign not found");
      }

      if (existingCampaign.brandId !== ctx.session.user.id) {
        throw new Error("You can only update your own campaigns");
      }

      // Validate date logic if dates are being updated
      if (
        updateData.endDate &&
        updateData.startDate &&
        updateData.endDate <= updateData.startDate
      ) {
        throw new Error("End date must be after start date");
      }

      // Validate follower range if being updated
      if (
        updateData.minFollowers &&
        updateData.maxFollowers &&
        updateData.minFollowers > updateData.maxFollowers
      ) {
        throw new Error(
          "Minimum followers cannot be greater than maximum followers",
        );
      }

      return await ctx.db.campaign.update({
        where: { id },
        data: updateData,
        include: {
          brand: {
            select: {
              name: true,
              brandProfile: true,
            },
          },
        },
      });
    }),

  // Delete a campaign
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existingCampaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
      });

      if (!existingCampaign) {
        throw new Error("Campaign not found");
      }

      if (existingCampaign.brandId !== ctx.session.user.id) {
        throw new Error("You can only delete your own campaigns");
      }

      return await ctx.db.campaign.delete({
        where: { id: input.id },
      });
    }),

  // Get all active campaigns (for creators to browse)
  getActiveCampaigns: protectedProcedure
    .input(
      z.object({
        niche: z.string().optional(),
        minBudget: z.number().optional(),
        maxBudget: z.number().optional(),
        location: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "CREATOR") {
        throw new Error("Only creators can browse campaigns");
      }

      // Build filter conditions
      const where: Prisma.CampaignWhereInput = {
        status: "ACTIVE",
        endDate: {
          gte: new Date(), // Only show campaigns that haven't ended
        },
      };

      if (input.niche) {
        where.niches = {
          has: input.niche,
        };
      }

      if (input.minBudget) {
        where.budget = { gte: input.minBudget };
      }

      // if (input.maxBudget) {
      //   where.budget = { ...where.budget, lte: input.maxBudget };
      // }

      if (input.location) {
        where.location = {
          contains: input.location,
          mode: "insensitive",
        };
      }

      return await ctx.db.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          brand: {
            select: {
              name: true,
              brandProfile: {
                select: {
                  companyName: true,
                  industry: true,
                },
              },
            },
          },
        },
      });
    }),

  // Get campaign analytics/stats
  getStats: protectedProcedure
    .input(z.object({ campaignId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "BRAND") {
        throw new Error("Only brands can view campaign stats");
      }

      if (input.campaignId) {
        // Stats for specific campaign
        const campaign = await ctx.db.campaign.findUnique({
          where: { id: input.campaignId },
        });

        if (!campaign || campaign.brandId !== ctx.session.user.id) {
          throw new Error("Campaign not found or unauthorized");
        }

        return {
          campaignId: input.campaignId,
          views: 0, // Placeholder - implement view tracking later
          applications: 0, // Placeholder - implement when application system is ready
          status: campaign.status,
        };
      } else {
        // Overall stats for brand
        const campaigns = await ctx.db.campaign.findMany({
          where: { brandId: ctx.session.user.id },
        });

        return {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE")
            .length,
          completedCampaigns: campaigns.filter((c) => c.status === "COMPLETED")
            .length,
          totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
        };
      }
    }),
});
