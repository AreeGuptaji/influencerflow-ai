"use client";

import { useState, useEffect } from "react";
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

export default function EditCampaignPage({
  params,
}: {
  params: { id: string };
}) {
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
  const [isFetchingCampaign, setIsFetchingCampaign] = useState(true);

  // Fetch campaign data
  const { data: campaign } = api.campaign.getById.useQuery(
    { id: params.id },
    {
      enabled: !!params.id,
    },
  );

  // Update form data when campaign data is fetched
  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title,
        description: campaign.description,
        budget: campaign.budget.toString(),
        startDate:
          new Date(campaign.startDate).toISOString().split("T")[0] ?? "",
        endDate: new Date(campaign.endDate).toISOString().split("T")[0] ?? "",
        niches: campaign.niches,
        location: campaign.location ?? "",
        minFollowers: campaign.minFollowers?.toString() ?? "",
        maxFollowers: campaign.maxFollowers?.toString() ?? "",
      });
      setIsFetchingCampaign(false);
    }
  }, [campaign]);

  const updateCampaignMutation = api.campaign.update.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/brand/campaign/${params.id}`);
    },
    onError: (error) => {
      console.error("Error updating campaign:", error);
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
    updateCampaignMutation.mutate({
      id: params.id,
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

  // Loading state
  if (isFetchingCampaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <p className="text-xl text-white">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() =>
              router.push(`/dashboard/brand/campaign/${params.id}`)
            }
            className="mb-4 flex items-center gap-2 text-white hover:text-gray-300"
          >
            ← Back to Campaign
          </button>
          <h1 className="mb-2 text-4xl font-bold text-white">Edit Campaign</h1>
          <p className="text-xl text-gray-300">
            Update your campaign details to better target creators
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
                min={today}
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white"
                required
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
                min={formData.startDate || today}
                className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white"
                required
              />
            </div>

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
                placeholder="e.g., 10000"
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

          {/* Niches */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Target Niches <span className="text-red-400">*</span>
            </label>
            <p className="mb-4 text-sm text-gray-300">
              Select the content niches that best fit your campaign (at least
              one)
            </p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {NICHE_OPTIONS.map((niche) => (
                <div
                  key={niche}
                  onClick={() => handleNicheToggle(niche)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:bg-white/10 ${
                    formData.niches.includes(niche)
                      ? "border-green-500 bg-green-500/20"
                      : "border-white/30 bg-white/5"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                        formData.niches.includes(niche)
                          ? "border-green-500 bg-green-500"
                          : "border-white/50"
                      }`}
                    >
                      {formData.niches.includes(niche) && (
                        <span className="text-xs text-white">✓</span>
                      )}
                    </div>
                    <span
                      className={`${
                        formData.niches.includes(niche)
                          ? "text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {niche}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/brand/campaign/${params.id}`)
              }
              className="rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-green-600 hover:to-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
