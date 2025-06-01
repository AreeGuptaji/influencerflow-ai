"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NegotiationStatus } from "@prisma/client";

interface Negotiation {
  id: string;
  status: NegotiationStatus;
  parameters: Record<string, any>;
  creatorEmail: string;
}

export default function NegotiationParametersPanel({
  negotiation,
  campaignId,
}: {
  negotiation: Negotiation;
  campaignId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState({
    followerCount: negotiation.parameters.followerCount || "",
    engagementRate: negotiation.parameters.engagementRate || "",
    niches: negotiation.parameters.niches || [],
    location: negotiation.parameters.location || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/negotiations/${negotiation.id}/parameters`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ parameters }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update parameters");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating parameters:", error);
      alert("Failed to update parameters. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setParameters({
      followerCount: negotiation.parameters.followerCount || "",
      engagementRate: negotiation.parameters.engagementRate || "",
      niches: negotiation.parameters.niches || [],
      location: negotiation.parameters.location || "",
    });
    setIsEditing(false);
  };

  const handleNicheChange = (index: number, value: string) => {
    const updatedNiches = [...parameters.niches];
    updatedNiches[index] = value;
    setParameters({ ...parameters, niches: updatedNiches });
  };

  const addNiche = () => {
    setParameters({ ...parameters, niches: [...parameters.niches, ""] });
  };

  const removeNiche = (index: number) => {
    if (parameters.niches.length > 1) {
      const updatedNiches = parameters.niches.filter((_, i) => i !== index);
      setParameters({ ...parameters, niches: updatedNiches });
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Creator Parameters</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={
              negotiation.status === "AGREED" ||
              negotiation.status === "REJECTED" ||
              negotiation.status === "FAILED" ||
              negotiation.status === "DONE"
            }
          >
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isEditing ? (
          // Edit mode
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Follower Count
              </label>
              <input
                type="number"
                value={parameters.followerCount}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    followerCount: e.target.value,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={parameters.engagementRate}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    engagementRate: e.target.value,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Content Niches
              </label>
              {parameters.niches.map((niche: string, index: number) => (
                <div key={index} className="mb-2 flex">
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => handleNicheChange(index, e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeNiche(index)}
                    className="ml-2 px-2 text-red-600"
                    disabled={parameters.niches.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addNiche}
                className="mt-1 text-sm text-blue-600"
              >
                + Add another niche
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={parameters.location}
                onChange={(e) =>
                  setParameters({ ...parameters, location: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        ) : (
          // View mode
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Follower Count</p>
                <p className="font-medium">
                  {negotiation.parameters.followerCount
                    ? Number(
                        negotiation.parameters.followerCount,
                      ).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Engagement Rate</p>
                <p className="font-medium">
                  {negotiation.parameters.engagementRate
                    ? `${negotiation.parameters.engagementRate}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Content Niches</p>
              {negotiation.parameters.niches &&
              (negotiation.parameters.niches as string[]).length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {(negotiation.parameters.niches as string[]).map(
                    (niche, index) => (
                      <span
                        key={index}
                        className="rounded bg-gray-100 px-2 py-1 text-xs"
                      >
                        {niche}
                      </span>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm">None specified</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">
                {negotiation.parameters.location || "Not specified"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
