import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/server";
import CreatorSelectionClient from "./CreatorSelectionClient";
import type { CreatorProfile } from "@prisma/client";
import type { Session } from "next-auth";

// Define interface for the props passed to the client component
interface FilteredCreator extends CreatorProfile {
  matchScore: number;
  matchReasons: string[];
}

// Interface for campaign with negotiations
interface CampaignWithNegotiations {
  id: string;
  title: string;
  description: string;
  budget: number;
  niches: string[];
  location: string | null;
  minFollowers: number | null;
  maxFollowers: number | null;
  Negotiation: {
    creatorId: string;
  }[];
}

export default async function CreatorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Get auth session and handle errors
  const sessionResult = await auth();
  const session = sessionResult as Session | null;

  // Extract id from params to prevent "params should be awaited" error
  const { id } = await params;

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Fetch campaign data
  const campaignResult = await db.campaign.findUnique({
    where: {
      id: id,
      brandId: session.user.id, // Ensure the campaign belongs to the logged in user
    },
    include: {
      Negotiation: {
        select: {
          creatorId: true,
        },
      },
    },
  });

  // Type-cast the result
  const campaign = campaignResult as CampaignWithNegotiations | null;

  // If campaign doesn't exist or doesn't belong to user, show 404
  if (!campaign) {
    notFound();
  }

  // Fetch all creators
  const creatorsResult = await db.creatorProfile.findMany();
  const allCreators = creatorsResult as CreatorProfile[];

  // Get list of already selected creator IDs from negotiations
  const selectedCreatorIds = campaign.Negotiation.map(
    (negotiation) => negotiation.creatorId,
  );

  // Filter creators based on campaign criteria
  const filteredCreators: FilteredCreator[] = allCreators
    .filter((creator) => {
      // Skip creators that are already selected
      if (selectedCreatorIds.includes(creator.id)) {
        return false;
      }

      // Filter by follower count if specified in campaign
      if (campaign.minFollowers && creator.followerCount) {
        if (creator.followerCount < campaign.minFollowers) {
          return false;
        }
      }

      if (campaign.maxFollowers && creator.followerCount) {
        if (creator.followerCount > campaign.maxFollowers) {
          return false;
        }
      }

      // Filter by niches if specified in campaign
      if (campaign.niches.length > 0 && creator.niches.length > 0) {
        const hasMatchingNiche = creator.niches.some((niche) =>
          campaign.niches.includes(niche),
        );
        if (!hasMatchingNiche) {
          return false;
        }
      }

      // Filter by location if specified in campaign
      if (campaign.location && creator.location) {
        if (
          !creator.location
            .toLowerCase()
            .includes(campaign.location.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    })
    .map((creator) => {
      // Calculate match score and reasons
      const matchReasons: string[] = [];
      let matchScore = 0;

      // Check follower match
      if (creator.followerCount) {
        if (campaign.minFollowers && campaign.maxFollowers) {
          const idealFollowerCount =
            (campaign.minFollowers + campaign.maxFollowers) / 2;
          const followerDiff = Math.abs(
            creator.followerCount - idealFollowerCount,
          );
          const followerRange = campaign.maxFollowers - campaign.minFollowers;
          const followerScore =
            100 - Math.min(100, (followerDiff / followerRange) * 100);
          matchScore += followerScore * 0.3; // 30% weight to follower count

          matchReasons.push(
            `Follower count (${creator.followerCount.toLocaleString()}) is within target range`,
          );
        } else if (campaign.minFollowers) {
          matchReasons.push(
            `Follower count (${creator.followerCount.toLocaleString()}) meets minimum requirement`,
          );
          matchScore += 30; // Base score for meeting minimum
        }
      }

      // Check niche match
      if (campaign.niches.length > 0 && creator.niches.length > 0) {
        const matchingNiches = creator.niches.filter((niche) =>
          campaign.niches.includes(niche),
        );

        if (matchingNiches.length > 0) {
          const nicheScore =
            (matchingNiches.length / campaign.niches.length) * 100;
          matchScore += nicheScore * 0.5; // 50% weight to niche match

          matchReasons.push(
            `Matches ${matchingNiches.length} of ${campaign.niches.length} target niches`,
          );
        }
      }

      // Check location match
      if (campaign.location && creator.location) {
        if (
          creator.location
            .toLowerCase()
            .includes(campaign.location.toLowerCase())
        ) {
          matchScore += 20; // 20% weight to location match
          matchReasons.push(`Location (${creator.location}) matches target`);
        }
      }

      // Add engagement rate as a bonus if available
      if (creator.engagementRate) {
        matchReasons.push(`Has ${creator.engagementRate}% engagement rate`);

        // Bonus points for higher engagement (up to 10% bonus)
        if (creator.engagementRate > 3) {
          const engagementBonus = Math.min(
            10,
            (creator.engagementRate - 3) * 2,
          );
          matchScore += engagementBonus;
        }
      }

      // Ensure score is between 0 and 100
      matchScore = Math.min(100, Math.max(0, matchScore));

      return {
        ...creator,
        matchScore: Math.round(matchScore),
        matchReasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score (highest first)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="mr-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Campaign
            </Link>
            <h1 className="text-2xl font-bold">
              Recommended Creators for {campaign.title}
            </h1>
          </div>
        </div>
        <p className="text-gray-600">
          Browse creators that match your campaign criteria. Select creators to
          add them to your campaign.
        </p>
      </div>

      {/* Pass the filtered creators to the client component */}
      <CreatorSelectionClient
        campaignId={campaign.id}
        creators={filteredCreators}
      />
    </div>
  );
}
