import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Validation schemas
const userRoleSchema = z.enum(["CREATOR", "BRAND"]);

const creatorProfileSchema = z.object({
  bio: z.string().optional(),
  niches: z.array(z.string()),
  followerCount: z.number().int().min(0).optional(),
  platforms: z.array(z.string()),
  location: z.string().optional(),
  engagementRate: z.number().min(0).max(100).optional(),
});

const brandProfileSchema = z.object({
  companyName: z.string().min(1),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
});

export const userRouter = createTRPCRouter({
  // Get current user with profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        creatorProfile: true,
        brandProfile: true,
      },
    });

    return user;
  }),

  // Set user role during onboarding
  setRole: protectedProcedure
    .input(z.object({ role: userRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          role: input.role,
        },
      });
    }),

  // Create or update creator profile
  updateCreatorProfile: protectedProcedure
    .input(creatorProfileSchema)
    .mutation(async ({ ctx, input }) => {
      // First ensure user is a creator
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "CREATOR") {
        throw new Error("User must be a creator to update creator profile");
      }

      // Upsert creator profile
      const profile = await ctx.db.creatorProfile.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          ...input,
          userId: ctx.session.user.id,
        },
      });

      // Mark onboarding as complete
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { onboardingComplete: true },
      });

      return profile;
    }),

  // Create or update brand profile
  updateBrandProfile: protectedProcedure
    .input(brandProfileSchema)
    .mutation(async ({ ctx, input }) => {
      // First ensure user is a brand
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (user?.role !== "BRAND") {
        throw new Error("User must be a brand to update brand profile");
      }

      // Upsert brand profile
      const profile = await ctx.db.brandProfile.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          ...input,
          userId: ctx.session.user.id,
        },
      });

      // Mark onboarding as complete
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { onboardingComplete: true },
      });

      return profile;
    }),

  // Check if onboarding is complete
  checkOnboarding: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        role: true,
        onboardingComplete: true,
        creatorProfile: true,
        brandProfile: true,
      },
    });

    return {
      hasRole: !!user?.role,
      hasProfile:
        user?.role === "CREATOR"
          ? !!user?.creatorProfile
          : !!user?.brandProfile,
      onboardingComplete: user?.onboardingComplete ?? false,
      role: user?.role,
    };
  }),
});
