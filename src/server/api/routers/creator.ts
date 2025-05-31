import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const creatorRouter = createTRPCRouter({
  // Find creators that match a campaign's criteria
  findMatchingCreators: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch the campaign details first
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
        select: {
          niches: true,
          location: true,
          minFollowers: true,
          maxFollowers: true,
          brandId: true,
        },
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Ensure user is authorized to access this campaign
      if (ctx.session.user.id !== campaign.brandId) {
        throw new Error("You can only view creators for your own campaigns");
      }

      // Build query for creators with proper typing
      const where: Prisma.CreatorProfileWhereInput = {};

      // Match creators who have at least one matching niche
      if (campaign.niches.length > 0) {
        where.niches = {
          hasSome: campaign.niches,
        };
      }

      // Filter by location if specified
      if (campaign.location) {
        where.location = {
          contains: campaign.location,
          mode: "insensitive",
        };
      }

      // Filter by follower count range
      if (campaign.minFollowers && campaign.maxFollowers) {
        // If both min and max are specified
        where.followerCount = {
          gte: campaign.minFollowers,
          lte: campaign.maxFollowers,
        };
      } else if (campaign.minFollowers) {
        // If only min is specified
        where.followerCount = {
          gte: campaign.minFollowers,
        };
      } else if (campaign.maxFollowers) {
        // If only max is specified
        where.followerCount = {
          lte: campaign.maxFollowers,
        };
      }

      // Fetch matching creators
      const creators = await ctx.db.creatorProfile.findMany({
        where,
      });

      // Calculate match score for each creator
      const creatorsWithScore = creators.map((creator) => {
        // Calculate base match score based on niche overlap
        const matchingNiches = creator.niches.filter((niche) =>
          campaign.niches.includes(niche),
        );
        const nicheScore =
          (matchingNiches.length / campaign.niches.length) * 100;

        // Adjust score based on follower count
        let followerScore = 100;
        if (campaign.minFollowers && campaign.maxFollowers) {
          const idealFollowerCount =
            (campaign.minFollowers + campaign.maxFollowers) / 2;
          const followerDiff = Math.abs(
            creator.followerCount! - idealFollowerCount,
          );
          const followerRange = campaign.maxFollowers - campaign.minFollowers;
          followerScore =
            100 - Math.min(100, (followerDiff / followerRange) * 100);
        }

        // Adjust score based on location match
        let locationScore = 100;
        if (
          campaign.location &&
          creator.location &&
          !creator.location
            .toLowerCase()
            .includes(campaign.location.toLowerCase())
        ) {
          locationScore = 60; // Partial score for location mismatch
        }

        // Calculate final weighted score
        const matchScore =
          nicheScore * 0.6 + followerScore * 0.3 + locationScore * 0.1;

        return {
          ...creator,
          matchScore,
        };
      });

      // Sort by match score (highest first)
      return creatorsWithScore.sort((a, b) => b.matchScore - a.matchScore);
    }),

  // Get all creators (for admin purposes)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.creatorProfile.findMany();
  }),

  // Get a single creator profile
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.creatorProfile.findUnique({
        where: { id: input.id },
      });
    }),

  // Create creator profile (admin only)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        username: z.string().optional(),
        email: z.string().optional(),
        bio: z.string().optional(),
        niches: z.array(z.string()),
        followerCount: z.number().optional(),
        platforms: z.array(z.string()),
        location: z.string().optional(),
        engagementRate: z.number().optional(),
        recentContent: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "ADMIN") {
        throw new Error("Only admins can create creator profiles");
      }

      return await ctx.db.creatorProfile.create({
        data: input,
      });
    }),

  // Update creator profile (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        username: z.string().optional(),
        email: z.string().optional(),
        bio: z.string().optional(),
        niches: z.array(z.string()).optional(),
        followerCount: z.number().optional(),
        platforms: z.array(z.string()).optional(),
        location: z.string().optional(),
        engagementRate: z.number().optional(),
        recentContent: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "ADMIN") {
        throw new Error("Only admins can update creator profiles");
      }

      const { id, ...data } = input;

      return await ctx.db.creatorProfile.update({
        where: { id },
        data,
      });
    }),

  // Delete creator profile (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is admin
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "ADMIN") {
        throw new Error("Only admins can delete creator profiles");
      }

      return await ctx.db.creatorProfile.delete({
        where: { id: input.id },
      });
    }),
});
