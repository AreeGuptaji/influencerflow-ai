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

export default function CreateCampaignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    startDate: "",
    endDate: "",
    niches: [] as string[],
    location: "",
    minFollowers: "",
    maxFollowers: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const createCampaignMutation = api.campaign.create.useMutation({
    onSuccess: () => {
      router.push("/dashboard/brand");
    },
    onError: (error) => {
      console.error("Error creating campaign:", error);
      setIsLoading(false);
      alert(error.message);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.niches.length === 0) {
      alert("Please select at least one niche");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert("End date must be after start date");
      return;
    }

    if (
      formData.minFollowers &&
      formData.maxFollowers &&
      parseInt(formData.minFollowers) > parseInt(formData.maxFollowers)
    ) {
      alert("Minimum followers cannot be greater than maximum followers");
      return;
    }

    setIsLoading(true);
    createCampaignMutation.mutate({
      title: formData.title,
      description: formData.description,
      budget: parseInt(formData.budget),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      niches: formData.niches,
      location: formData.location || undefined,
      minFollowers: formData.minFollowers
        ? parseInt(formData.minFollowers)
        : undefined,
      maxFollowers: formData.maxFollowers
        ? parseInt(formData.maxFollowers)
        : undefined,
    });
  };

  // Get today's date for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-white hover:text-gray-300"
          >
            ← Back to Dashboard
          </button>
          <h1 className="mb-2 text-4xl font-bold text-white">
            Create New Campaign
          </h1>
          <p className="text-xl text-gray-300">
            Set up your influencer campaign to start connecting with creators
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md"
        >
          {/* Campaign Basics */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-3 block text-lg font-semibold text-white">
                Campaign Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Summer Fashion Collection Launch"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-3 block text-lg font-semibold text-white">
                Campaign Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your campaign goals, what you're looking for in creators, deliverables, and any specific requirements..."
                className="w-full resize-none rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Budget ($) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budget: e.target.value }))
                }
                placeholder="e.g., 5000"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
                required
                min="1"
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Location (Optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g., New York, Global, USA"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white"
                required
                min={today}
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white"
                required
                min={formData.startDate || today}
              />
            </div>
          </div>

          {/* Target Niches */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Target Niches <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {NICHE_OPTIONS.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleNicheToggle(niche)}
                  className={`rounded-lg border p-3 transition-all duration-200 ${
                    formData.niches.includes(niche)
                      ? "border-blue-400 bg-blue-500 text-white"
                      : "border-white/30 bg-white/20 text-gray-300 hover:bg-white/30"
                  } `}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Follower Range */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Minimum Followers (Optional)
              </label>
              <input
                type="number"
                value={formData.minFollowers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minFollowers: e.target.value,
                  }))
                }
                placeholder="e.g., 1000"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
                min="0"
              />
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold text-white">
                Maximum Followers (Optional)
              </label>
              <input
                type="number"
                value={formData.maxFollowers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxFollowers: e.target.value,
                  }))
                }
                placeholder="e.g., 100000"
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
                min="0"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg bg-gray-500 py-4 font-semibold text-white transition-colors hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.niches.length === 0}
              className={`flex-1 rounded-lg py-4 font-semibold transition-all duration-200 ${
                isLoading || formData.niches.length === 0
                  ? "cursor-not-allowed bg-gray-500"
                  : "transform bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 hover:from-green-600 hover:to-blue-600"
              } text-white`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
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
                  Creating Campaign...
                </span>
              ) : (
                "Create Campaign"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
