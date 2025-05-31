"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import Link from "next/link";

export default function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch campaign data
  const { data: campaign, refetch: refetchCampaign } =
    api.campaign.getById.useQuery(
      { id: params.id },
      {
        enabled: !!params.id,
      },
    );

  // Fetch matching creators for this campaign
  const { data: matchingCreators, isLoading: isLoadingCreators } =
    api.creator.findMatchingCreators.useQuery(
      { campaignId: params.id },
      {
        enabled: !!params.id && campaign?.status === "ACTIVE",
      },
    );

  // Mutations
  const updateCampaignMutation = api.campaign.update.useMutation({
    onSuccess: () => {
      void refetchCampaign();
      setIsUpdatingStatus(false);
    },
    onError: (error) => {
      console.error("Error updating campaign:", error);
      setIsUpdatingStatus(false);
      alert(error.message);
    },
  });

  const deleteCampaignMutation = api.campaign.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard/brand");
    },
    onError: (error) => {
      console.error("Error deleting campaign:", error);
      alert(error.message);
    },
  });

  // Handle status update
  const handleStatusUpdate = (
    newStatus: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED",
  ) => {
    if (!campaign) return;

    // Prevent activation if campaign dates are invalid
    if (newStatus === "ACTIVE" && new Date(campaign.endDate) <= new Date()) {
      alert("Cannot activate a campaign with an end date in the past");
      return;
    }

    setIsUpdatingStatus(true);
    updateCampaignMutation.mutate({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      niches: campaign.niches,
      location: campaign.location || undefined,
      minFollowers: campaign.minFollowers || undefined,
      maxFollowers: campaign.maxFollowers || undefined,
      status: newStatus,
    });
  };

  // Handle campaign deletion
  const handleDelete = () => {
    if (!campaign) return;
    deleteCampaignMutation.mutate({ id: campaign.id });
  };

  // Loading state
  if (!campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <p className="text-xl text-white">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  // Status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "DRAFT":
        return "bg-yellow-500";
      case "PAUSED":
        return "bg-orange-500";
      case "COMPLETED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/brand")}
            className="mb-4 flex items-center gap-2 text-white hover:text-gray-300"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white">{campaign.title}</h1>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/brand/campaign/${campaign.id}/edit`}
                className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-yellow-600"
              >
                Edit Campaign
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`${getStatusColor(
                campaign.status,
              )} rounded-full px-3 py-1 text-sm font-medium text-white`}
            >
              {campaign.status}
            </span>
            <span className="text-lg text-gray-300">
              Budget: ${campaign.budget.toLocaleString()}
            </span>
            <span className="text-lg text-gray-300">
              {new Date(campaign.startDate).toLocaleDateString()} to{" "}
              {new Date(campaign.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Campaign Content */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Campaign Details
              </h2>
              <div className="mb-6 text-lg whitespace-pre-wrap text-gray-300">
                {campaign.description}
              </div>

              <h3 className="mb-2 text-xl font-semibold text-white">
                Target Niches
              </h3>
              <div className="mb-6 flex flex-wrap gap-2">
                {campaign.niches.map((niche) => (
                  <span
                    key={niche}
                    className="rounded-full bg-purple-500/30 px-3 py-1 text-sm text-white"
                  >
                    {niche}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {campaign.location && (
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Location
                    </h3>
                    <p className="text-gray-300">{campaign.location}</p>
                  </div>
                )}

                {(campaign.minFollowers || campaign.maxFollowers) && (
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Follower Range
                    </h3>
                    <p className="text-gray-300">
                      {campaign.minFollowers
                        ? campaign.minFollowers.toLocaleString()
                        : "0"}{" "}
                      to{" "}
                      {campaign.maxFollowers
                        ? campaign.maxFollowers.toLocaleString()
                        : "Unlimited"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Campaign Status
              </h2>

              <div className="mb-6">
                <p className="mb-2 text-gray-300">
                  Current status:{" "}
                  <span className="font-semibold text-white">
                    {campaign.status}
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  {campaign.status === "DRAFT" &&
                    "Your campaign is in draft mode. Activate it to start finding creators."}
                  {campaign.status === "ACTIVE" &&
                    "Your campaign is active and visible to matching creators."}
                  {campaign.status === "PAUSED" &&
                    "Your campaign is paused. Reactivate it to continue."}
                  {campaign.status === "COMPLETED" &&
                    "This campaign has been completed."}
                </p>
              </div>

              <div className="space-y-3">
                {campaign.status !== "ACTIVE" && (
                  <button
                    onClick={() => handleStatusUpdate("ACTIVE")}
                    disabled={isUpdatingStatus}
                    className="w-full rounded-lg bg-green-500 py-2 font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating..." : "Activate Campaign"}
                  </button>
                )}

                {campaign.status === "ACTIVE" && (
                  <button
                    onClick={() => handleStatusUpdate("PAUSED")}
                    disabled={isUpdatingStatus}
                    className="w-full rounded-lg bg-orange-500 py-2 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating..." : "Pause Campaign"}
                  </button>
                )}

                {campaign.status !== "DRAFT" &&
                  campaign.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleStatusUpdate("COMPLETED")}
                      disabled={isUpdatingStatus}
                      className="w-full rounded-lg bg-blue-500 py-2 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isUpdatingStatus ? "Updating..." : "Mark as Completed"}
                    </button>
                  )}

                {campaign.status !== "DRAFT" && (
                  <button
                    onClick={() => handleStatusUpdate("DRAFT")}
                    disabled={isUpdatingStatus}
                    className="w-full rounded-lg bg-gray-500 py-2 font-semibold text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Updating..." : "Return to Draft"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Matching Creators Section */}
        {campaign.status === "ACTIVE" && (
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <h2 className="mb-6 text-2xl font-bold text-white">
              Matching Creators
            </h2>

            {isLoadingCreators ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                <p className="ml-3 text-white">Finding matching creators...</p>
              </div>
            ) : matchingCreators && matchingCreators.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {matchingCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {creator.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {creator.followerCount?.toLocaleString() ?? "0"}{" "}
                          followers
                        </p>
                      </div>
                      <div className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
                        {Math.round(creator.matchScore)}% match
                      </div>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-1">
                      {creator.niches.slice(0, 3).map((niche) => (
                        <span
                          key={niche}
                          className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-white"
                        >
                          {niche}
                        </span>
                      ))}
                      {creator.niches.length > 3 && (
                        <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-white">
                          +{creator.niches.length - 3} more
                        </span>
                      )}
                    </div>

                    <button className="w-full rounded-lg bg-blue-500 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600">
                      Start Negotiation
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <p className="mb-2 text-xl text-white">
                  No matching creators found
                </p>
                <p className="text-gray-400">
                  Try adjusting your campaign criteria to find more creators
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">
              Delete Campaign
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
