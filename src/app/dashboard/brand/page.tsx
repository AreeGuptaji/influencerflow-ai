"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { signOut } from "next-auth/react";

export default function BrandDashboard() {
  const router = useRouter();
  const { data: profile } = api.user.getProfile.useQuery();
  const { data: campaigns, refetch: refetchCampaigns } =
    api.campaign.getMyBrandCampaigns.useQuery();
  const { data: stats } = api.campaign.getStats.useQuery({});

  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const deleteCampaignMutation = api.campaign.delete.useMutation({
    onSuccess: () => {
      void refetchCampaigns();
      setShowDeleteModal(null);
    },
  });

  const handleDeleteCampaign = (campaignId: string) => {
    deleteCampaignMutation.mutate({ id: campaignId });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Brand Dashboard</h1>
              <p className="mt-1 text-gray-300">
                Welcome back,{" "}
                {profile?.brandProfile?.companyName ?? profile?.name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard/brand/create-campaign")}
                className="transform rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-blue-600"
              >
                + Create Campaign
              </button>
              <button
                onClick={handleSignOut}
                className="transform rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-gray-600 hover:to-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Total Campaigns</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.totalCampaigns ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Active Campaigns</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.activeCampaigns ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.completedCampaigns ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Total Budget</p>
                <p className="text-2xl font-bold text-white">
                  ${stats?.totalBudget?.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
          <div className="border-b border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
          </div>

          <div className="p-6">
            {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-white">
                            {campaign.title}
                          </h3>
                          <span
                            className={`${getStatusColor(campaign.status)} rounded-full px-2 py-1 text-xs font-medium text-white`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <p className="mb-3 line-clamp-2 text-gray-300">
                          {campaign.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span>💰 ${campaign.budget.toLocaleString()}</span>
                          <span>
                            📅{" "}
                            {new Date(campaign.startDate).toLocaleDateString()}
                          </span>
                          <span>📍 {campaign.location ?? "Any location"}</span>
                          <span>
                            🎯 {campaign.niches.slice(0, 2).join(", ")}
                            {campaign.niches.length > 2 &&
                              ` +${campaign.niches.length - 2} more`}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/brand/campaign/${campaign.id}`,
                            )
                          }
                          className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/brand/campaign/${campaign.id}/edit`,
                            )
                          }
                          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm text-white transition-colors hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(campaign.id)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  No campaigns yet
                </h3>
                <p className="mb-6 text-gray-300">
                  Create your first campaign to start connecting with creators
                </p>
                <button
                  onClick={() =>
                    router.push("/dashboard/brand/create-campaign")
                  }
                  className="rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-green-600 hover:to-blue-600"
                >
                  Create Your First Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-xl font-bold text-white">
              Delete Campaign
            </h3>
            <p className="mb-6 text-gray-300">
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 rounded-lg bg-gray-500 py-2 text-white transition-colors hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCampaign(showDeleteModal)}
                disabled={deleteCampaignMutation.isPending}
                className="flex-1 rounded-lg bg-red-500 py-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleteCampaignMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
