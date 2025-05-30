"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { signOut } from "next-auth/react";

export default function CreatorDashboard() {
  const router = useRouter();
  const { data: profile } = api.user.getProfile.useQuery();
  const { data: campaigns } = api.campaign.getActiveCampaigns.useQuery({});

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Creator Dashboard
              </h1>
              <p className="mt-1 text-gray-300">
                Welcome back, {profile?.name}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="transform rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-purple-600 hover:to-pink-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Creator Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Followers</p>
                <p className="text-2xl font-bold text-white">
                  {profile?.creatorProfile?.followerCount?.toLocaleString() ??
                    "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Engagement Rate</p>
                <p className="text-2xl font-bold text-white">
                  {profile?.creatorProfile?.engagementRate
                    ? `${profile.creatorProfile.engagementRate}%`
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Niches</p>
                <p className="text-2xl font-bold text-white">
                  {profile?.creatorProfile?.niches?.length ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500">
                <span className="text-2xl">📱</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-300">Platforms</p>
                <p className="text-2xl font-bold text-white">
                  {profile?.creatorProfile?.platforms?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Overview */}
        <div className="mb-8 rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <h2 className="mb-4 text-2xl font-bold text-white">Your Profile</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Bio</h3>
              <p className="text-gray-300">
                {profile?.creatorProfile?.bio ??
                  "Add a bio to help brands understand what you do"}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Location
              </h3>
              <p className="text-gray-300">
                {profile?.creatorProfile?.location ?? "Not specified"}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Content Niches
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.creatorProfile?.niches?.length ? (
                  profile.creatorProfile.niches.map((niche: string) => (
                    <span
                      key={niche}
                      className="rounded-full bg-purple-500/30 px-3 py-1 text-sm text-purple-200"
                    >
                      {niche}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No niches selected</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Social Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.creatorProfile?.platforms?.length ? (
                  profile.creatorProfile.platforms.map((platform: string) => (
                    <span
                      key={platform}
                      className="rounded-full bg-blue-500/30 px-3 py-1 text-sm text-blue-200"
                    >
                      {platform}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No platforms selected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Available Campaigns Section */}
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
          <div className="border-b border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white">
              Available Campaigns
            </h2>
            <p className="mt-1 text-gray-300">
              Discover brand partnerships that match your content
            </p>
          </div>

          <div className="p-6">
            {campaigns && campaigns.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-lg border border-white/20 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <h3 className="mb-2 text-xl font-semibold text-white">
                      {campaign.title}
                    </h3>
                    <p className="mb-3 text-sm text-gray-300">
                      {campaign.description.substring(0, 100)}...
                    </p>
                    <div className="mb-3 flex items-center text-sm text-gray-400">
                      <span className="mr-2">💰</span>
                      <span>${campaign.budget.toLocaleString()}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {campaign.niches.map((niche) => (
                        <span
                          key={niche}
                          className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-200"
                        >
                          {niche}
                        </span>
                      ))}
                    </div>
                    <button className="w-full rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-indigo-600">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
                  <span className="text-4xl">🚀</span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  No Active Campaigns Found
                </h3>
                <p className="mb-6 text-gray-300">
                  We&apos;re working to bring you relevant brand partnerships
                  that match your profile.
                </p>
                <div className="mx-auto max-w-md rounded-lg border border-blue-400/30 bg-blue-500/20 p-4">
                  <h4 className="mb-2 font-semibold text-white">
                    Tips to Get Matched:
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Complete your creator profile</li>
                    <li>• Add your content niches</li>
                    <li>• Link your social platforms</li>
                    <li>• Check back regularly for new opportunities</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
