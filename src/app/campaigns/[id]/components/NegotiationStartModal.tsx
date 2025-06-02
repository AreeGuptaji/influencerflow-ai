"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Add type declaration for uuid if needed
declare module "uuid" {
  export function v4(): string;
}

interface NegotiationResponse {
  creatorId: string;
  negotiationId: string;
  status: string;
}

export default function NegotiationStartModal({
  campaignId,
}: {
  campaignId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [creatorEmail, setCreatorEmail] = useState("");
  const [parameters, setParameters] = useState({
    followerCount: "",
    engagementRate: "",
    niches: [""],
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!creatorEmail) {
      setError("Creator email is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const creatorId = uuidv4();

      const response = await fetch(
        `/api/campaigns/${campaignId}/negotiations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creatorId,
            creatorEmail,
            parameters,
            aiMode: "AUTONOMOUS",
          }),
        },
      );

      if (!response.ok) {
        const errorData = (await response.json()) as {
          message?: string;
          error?: string;
        };
        throw new Error(
          errorData.message || errorData.error || "Failed to start negotiation",
        );
      }

      const data = (await response.json()) as NegotiationResponse;
      router.push(`/campaigns/${campaignId}/negotiate/${data.creatorId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mt-8">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Start New Negotiation
        </button>
      </div>

      {isOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Start New Negotiation
              </h2>

              {error && (
                <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Creator Email
                  </label>
                  <input
                    type="email"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="creator@example.com"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Estimated Follower Count
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="10000"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Estimated Engagement Rate (%)
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="3.5"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Content Niches
                  </label>
                  {parameters.niches.map((niche, index) => (
                    <div key={index} className="mb-2 flex">
                      <input
                        type="text"
                        value={niche}
                        onChange={(e) =>
                          handleNicheChange(index, e.target.value)
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Fitness, Tech, Beauty, etc."
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

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={parameters.location}
                    onChange={(e) =>
                      setParameters({ ...parameters, location: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="US, UK, Global, etc."
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mr-2 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isSubmitting ? "Starting..." : "Start Negotiation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
