"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

const NICHE_OPTIONS = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Gaming",
  "Tech",
  "Lifestyle",
  "Business",
  "Education",
  "Entertainment",
  "Sports",
  "Music",
  "Art",
  "Photography",
  "Comedy",
  "Finance",
  "Health",
];

const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter",
  "LinkedIn",
  "Twitch",
  "Pinterest",
];

export default function CreatorProfilePage() {
  const [formData, setFormData] = useState({
    bio: "",
    niches: [] as string[],
    followerCount: "",
    platforms: [] as string[],
    location: "",
    engagementRate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateProfileMutation = api.user.updateCreatorProfile.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      setIsLoading(false);
    },
  });

  const handleNicheToggle = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.niches.length === 0 || formData.platforms.length === 0) {
      alert("Please select at least one niche and one platform");
      return;
    }

    setIsLoading(true);
    updateProfileMutation.mutate({
      bio: formData.bio || undefined,
      niches: formData.niches,
      followerCount: formData.followerCount
        ? parseInt(formData.followerCount)
        : undefined,
      platforms: formData.platforms,
      location: formData.location || undefined,
      engagementRate: formData.engagementRate
        ? parseFloat(formData.engagementRate)
        : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Complete Your Creator Profile
          </h1>
          <p className="text-xl text-gray-300">
            Tell us about yourself to get the best brand partnership
            opportunities
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md"
        >
          {/* Bio Section */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell brands about yourself, your content style, and what makes you unique..."
              className="w-full resize-none rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              rows={4}
            />
          </div>

          {/* Niches Section */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Content Niches <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {NICHE_OPTIONS.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleNicheToggle(niche)}
                  className={`rounded-lg border p-3 transition-all duration-200 ${
                    formData.niches.includes(niche)
                      ? "border-green-400 bg-green-500 text-white"
                      : "border-white/30 bg-white/20 text-gray-300 hover:bg-white/30"
                  } `}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms Section */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Social Platforms <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(platform)}
                  className={`rounded-lg border p-3 transition-all duration-200 ${
                    formData.platforms.includes(platform)
                      ? "border-blue-400 bg-blue-500 text-white"
                      : "border-white/30 bg-white/20 text-gray-300 hover:bg-white/30"
                  } `}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Total Followers
              </label>
              <input
                type="number"
                value={formData.followerCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    followerCount: e.target.value,
                  }))
                }
                placeholder="e.g., 5000"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.engagementRate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    engagementRate: e.target.value,
                  }))
                }
                placeholder="e.g., 3.5"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g., New York, NY"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={
                isLoading ||
                formData.niches.length === 0 ||
                formData.platforms.length === 0
              }
              className={`rounded-lg px-8 py-4 text-lg font-semibold transition-all duration-200 ${
                isLoading ||
                formData.niches.length === 0 ||
                formData.platforms.length === 0
                  ? "cursor-not-allowed bg-gray-500"
                  : "transform bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 hover:from-green-600 hover:to-blue-600"
              } text-white`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Profile...
                </span>
              ) : (
                "Complete Setup & Go to Dashboard"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
