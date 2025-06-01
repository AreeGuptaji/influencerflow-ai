"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreatorProfile } from "@prisma/client";

// Define interface for the creators with match score and reasons
interface FilteredCreator extends CreatorProfile {
  matchScore: number;
  matchReasons: string[];
}

export default function CreatorSelectionClient({
  campaignId,
  creators,
}: {
  campaignId: string;
  creators: FilteredCreator[];
}) {
  const router = useRouter();
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [visibleCreators, setVisibleCreators] =
    useState<FilteredCreator[]>(creators);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle creator selection/deselection
  const toggleCreatorSelection = (id: string) => {
    setSelectedCreators((current) =>
      current.includes(id)
        ? current.filter((creatorId) => creatorId !== id)
        : [...current, id],
    );
  };

  // Remove creator from view
  const removeFromView = (id: string) => {
    setVisibleCreators((current) =>
      current.filter((creator) => creator.id !== id),
    );

    // Also remove from selection if selected
    if (selectedCreators.includes(id)) {
      toggleCreatorSelection(id);
    }
  };

  // Handle adding selected creators to campaign
  const addCreatorsToCampaign = async () => {
    if (selectedCreators.length === 0) {
      setError("Please select at least one creator");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Make individual requests for each selected creator
      const promises = selectedCreators.map((creatorId) => {
        const creator = creators.find((c) => c.id === creatorId);

        if (!creator) return Promise.resolve();

        // Create negotiation with PENDING_OUTREACH status
        return fetch(`/api/campaigns/${campaignId}/negotiations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creatorId,
            creatorEmail: creator.email ?? `creator${creatorId}@example.com`, // Fallback email if not available
            parameters: {
              followerCount: creator.followerCount,
              engagementRate: creator.engagementRate,
              niches: creator.niches,
              location: creator.location,
            },
            aiMode: "AUTONOMOUS", // Default to autonomous mode
          }),
        });
      });

      await Promise.all(promises);

      // Refresh the page and navigate back to campaign
      router.push(`/campaigns/${campaignId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Display error if no creators match criteria
  if (visibleCreators.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No matching creators found
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Try adjusting your campaign criteria to find more creators
        </p>
        <button
          onClick={() => router.push(`/campaigns/${campaignId}/edit`)}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Edit Campaign Criteria
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Selection summary and action bar */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 p-4">
        <div>
          <span className="text-sm text-gray-600">
            {selectedCreators.length} creators selected
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCreators([])}
            disabled={selectedCreators.length === 0}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear Selection
          </button>
          <button
            onClick={addCreatorsToCampaign}
            disabled={selectedCreators.length === 0 || isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Adding..." : "Add to Campaign"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Creator cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleCreators.map((creator) => (
          <div
            key={creator.id}
            className={`relative rounded-lg border p-4 shadow-sm transition-all ${
              selectedCreators.includes(creator.id)
                ? "border-blue-500 ring-2 ring-blue-500"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            {/* Remove button */}
            <button
              onClick={() => removeFromView(creator.id)}
              className="absolute top-2 right-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Remove from view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Match score badge */}
            <div className="absolute top-4 left-4 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
              {creator.matchScore}% Match
            </div>

            {/* Creator profile info */}
            <div className="mt-8 mb-4 flex flex-col items-center">
              <div className="mb-2 h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xl font-semibold text-blue-800">
                  {creator.name && creator.name.length > 0
                    ? creator.name.charAt(0).toUpperCase()
                    : "C"}
                </div>
              </div>
              <h3 className="text-center text-lg font-medium text-gray-900">
                {creator.name ?? "Creator " + creator.id.substring(0, 4)}
              </h3>
              <p className="text-center text-sm text-gray-500">
                {creator.followerCount?.toLocaleString() ?? "Unknown"} followers
              </p>
              {creator.engagementRate && (
                <p className="text-center text-sm text-green-600">
                  {creator.engagementRate}% engagement
                </p>
              )}
            </div>

            {/* Niches */}
            {creator.niches.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-gray-500">Niches</p>
                <div className="flex flex-wrap gap-1">
                  {creator.niches.map((niche, index) => (
                    <span
                      key={index}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
                    >
                      {niche}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {creator.location && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Location
                </p>
                <p className="text-sm text-gray-700">{creator.location}</p>
              </div>
            )}

            {/* Match reasons */}
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium text-gray-500">
                Why this creator?
              </p>
              <ul className="list-inside list-disc text-xs text-gray-600">
                {creator.matchReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            {/* Selection button */}
            <button
              onClick={() => toggleCreatorSelection(creator.id)}
              className={`mt-2 w-full rounded-md py-2 text-sm font-medium ${
                selectedCreators.includes(creator.id)
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {selectedCreators.includes(creator.id) ? "Selected" : "Select"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
