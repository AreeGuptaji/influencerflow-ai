import { auth } from "@/server/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import {
  CampaignStatus,
  AIMode,
  NegotiationStatus,
  MessageSender,
} from "@prisma/client";
import { format } from "date-fns";
import { api } from "@/trpc/server";

import NegotiationStartModal from "./components/NegotiationStartModal";

// Define types for the data structures
interface SelectedCreator {
  id: string;
  name: string;
  followers: number;
  engagement: number;
  categories: string[];
  location: string;
  status: string;
}

interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
}

interface Term {
  fee: number;
  deliverables: string[];
  requirements: string[];
  revisions: number;
}

interface NegotiationParameters {
  followerCount?: string | number;
  engagementRate?: string | number;
  niches?: string[];
  location?: string;
  [key: string]: unknown;
}

interface Negotiation {
  id: string;
  creatorId: string;
  creatorEmail: string;
  status: NegotiationStatus;
  parameters: NegotiationParameters;
  messages: Message[];
  terms?: Term;
}

interface CampaignWithNegotiations {
  id: string;
  title: string;
  description: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  niches: string[];
  location: string | null;
  minFollowers: number | null;
  maxFollowers: number | null;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
  Negotiation: Negotiation[];
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  // Extract id from params to prevent "params should be awaited" error
  const { id } = await params;

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Fetch campaign data from database
  const campaign = (await db.campaign.findUnique({
    where: {
      id: id,
      brandId: session.user.id, // Ensure the campaign belongs to the logged in user
    },
    include: {
      Negotiation: {
        include: {
          terms: true,
          messages: {
            orderBy: {
              timestamp: "desc",
            },
            take: 1,
          },
        },
      },
    },
  })) as CampaignWithNegotiations | null;

  // If campaign doesn't exist or doesn't belong to user, show 404
  if (!campaign) {
    notFound();
  }

  // Transform data to handle in the UI
  const selectedCreators: SelectedCreator[] = campaign.Negotiation.map(
    (negotiation) => {
      // Get the latest message status
      const latestMessage = negotiation.messages[0];

      // Determine status display
      let statusDisplay = "Matched";
      if (
        negotiation.status === "IN_PROGRESS" ||
        negotiation.status === "TERMS_PROPOSED"
      ) {
        statusDisplay = "Negotiating";
      } else if (negotiation.status === "AGREED") {
        statusDisplay = "Contracted";
      }

      // Extract parameters with proper type checking
      const params = negotiation.parameters;

      // Safely extract follower count
      let followerCount = 0;
      if (params.followerCount !== undefined) {
        followerCount =
          typeof params.followerCount === "string"
            ? parseInt(params.followerCount, 10)
            : typeof params.followerCount === "number"
              ? params.followerCount
              : 0;
      }

      // Safely extract engagement rate
      let engagementRate = 0;
      if (params.engagementRate !== undefined) {
        engagementRate =
          typeof params.engagementRate === "string"
            ? parseFloat(params.engagementRate)
            : typeof params.engagementRate === "number"
              ? params.engagementRate
              : 0;
      }

      // Safely extract niches
      const niches = Array.isArray(params.niches)
        ? params.niches.map(String)
        : [];

      // Safely extract location
      const location =
        typeof params.location === "string" ? params.location : "Unknown";

      // Ensure name is always a string
      const name = negotiation.creatorEmail.split("@")[0] ?? "Unknown";

      return {
        id: negotiation.creatorId,
        name,
        followers: followerCount,
        engagement: engagementRate,
        categories: niches,
        location,
        status: statusDisplay,
      };
    },
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/campaigns"
              className="mr-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Campaigns
            </Link>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <span
              className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${
                campaign.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : campaign.status === "DRAFT"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <div>
            <Link
              href={`/campaigns/${campaign.id}/edit`}
              className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit Campaign
            </Link>
            {campaign.status === "DRAFT" ? (
              <form
                action={`/api/campaigns/${campaign.id}/status`}
                method="POST"
              >
                <input type="hidden" name="status" value="ACTIVE" />
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Launch Campaign
                </button>
              </form>
            ) : campaign.status === "ACTIVE" ? (
              <form
                action={`/api/campaigns/${campaign.id}/status`}
                method="POST"
              >
                <input type="hidden" name="status" value="PAUSED" />
                <button
                  type="submit"
                  className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Pause Campaign
                </button>
              </form>
            ) : (
              <form
                action={`/api/campaigns/${campaign.id}/status`}
                method="POST"
              >
                <input type="hidden" name="status" value="ACTIVE" />
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Resume Campaign
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Campaign Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{campaign.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium text-gray-900">
                  ${campaign.budget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {format(campaign.createdAt, "MM/dd/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">
                  {format(campaign.startDate, "MM/dd/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">
                  {format(campaign.endDate, "MM/dd/yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Targeting Criteria</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Content Niches</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {campaign.niches.map((niche) => (
                  <span
                    key={niche}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {campaign.location ?? "Any"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Follower Range</p>
              <p className="font-medium text-gray-900">
                {campaign.minFollowers?.toLocaleString() ?? 0} -{" "}
                {campaign.maxFollowers?.toLocaleString() ?? "Any"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Campaign Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {selectedCreators.length}
              </p>
              <p className="text-sm text-blue-600">Creators</p>
            </div>
            <div className="rounded-md bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {
                  selectedCreators.filter((c) => c.status === "Contracted")
                    .length
                }
              </p>
              <p className="text-sm text-green-600">Contracted</p>
            </div>
            <div className="rounded-md bg-yellow-50 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {
                  selectedCreators.filter((c) => c.status === "Negotiating")
                    .length
                }
              </p>
              <p className="text-sm text-yellow-600">Negotiating</p>
            </div>
            <div className="rounded-md bg-purple-50 p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {selectedCreators.filter((c) => c.status === "Matched").length}
              </p>
              <p className="text-sm text-purple-600">Matched</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Creators */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Selected Creators</h2>
          <Link
            href={`/campaigns/${campaign.id}/creators`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find More Creators
          </Link>
        </div>

        {selectedCreators.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Creator
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Followers
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Engagement
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Categories
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {selectedCreators.map((creator) => (
                  <tr key={creator.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                          <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-800">
                            {creator.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {creator.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {creator.followers.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <span className="text-green-600">
                        {creator.engagement}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {creator.categories.map((category) => (
                          <span
                            key={category}
                            className="rounded bg-gray-100 px-2 py-1 text-xs"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {creator.location}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          creator.status === "Contracted"
                            ? "bg-green-100 text-green-800"
                            : creator.status === "Negotiating"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {creator.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {creator.status === "Matched" && (
                        <Link
                          href={`/campaigns/${campaign.id}/negotiate/${campaign.Negotiation.find((n) => n.creatorId === creator.id)?.id ?? creator.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Start Negotiation
                        </Link>
                      )}
                      {creator.status === "Negotiating" && (
                        <Link
                          href={`/campaigns/${campaign.id}/negotiate/${campaign.Negotiation.find((n) => n.creatorId === creator.id)?.id ?? creator.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Conversation
                        </Link>
                      )}
                      {creator.status === "Contracted" && (
                        <Link
                          href={`/campaigns/${campaign.id}/negotiate/${campaign.Negotiation.find((n) => n.creatorId === creator.id)?.id ?? creator.id}?view=contract`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Contract
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No creators selected yet
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Find and select creators that match your campaign criteria
            </p>
            <Link
              href={`/campaigns/${campaign.id}/creators`}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Find Creators
            </Link>
          </div>
        )}
      </div>

      {/* Voice Negotiation Section */}
      <div className="rounded-md bg-gradient-to-r from-blue-50 to-purple-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-blue-900">
              AI Voice Negotiation
            </h2>
            <p className="mb-2 text-gray-700">
              Let our AI voice agent negotiate with creators on your behalf.
            </p>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/voice-settings`}
            className="rounded-md bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white hover:from-blue-600 hover:to-purple-700"
          >
            Configure Voice Negotiation
          </Link>
        </div>
      </div>

      {/* This will be a client component for starting negotiations with new creators */}
      <NegotiationStartModal campaignId={campaign.id} />
    </div>
  );
}
