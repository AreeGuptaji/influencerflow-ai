"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NegotiationStatus } from "@prisma/client";
import Link from "next/link";

interface DealTerms {
  id: string;
  fee: number;
  deliverables: string[];
  timeline: {
    startDate: string;
    endDate: string;
    milestones?: Array<{ date: string; description: string }>;
  };
  requirements: string[];
  revisions: number;
  approvedAt?: Date | null;
}

export default function NegotiationTermsPanel({
  terms,
  status,
  campaignId,
  negotiationId,
}: {
  terms: DealTerms | null;
  status: NegotiationStatus;
  campaignId: string;
  negotiationId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dealTerms, setDealTerms] = useState<DealTerms | null>(terms);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Create empty terms object for new terms
  const createEmptyTerms = (): DealTerms => {
    // Ensure we always have string values, not undefined
    const today = new Date().toISOString().split("T")[0] || "2023-01-01";
    const thirtyDaysLater =
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0] || "2023-01-31";

    return {
      id: "",
      fee: 0,
      deliverables: [""],
      timeline: {
        startDate: today,
        endDate: thirtyDaysLater,
      },
      requirements: [""],
      revisions: 1,
    };
  };

  const handleAddTerms = () => {
    setDealTerms(createEmptyTerms());
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!dealTerms) return;

    setIsSaving(true);
    try {
      const endpoint = terms
        ? `/api/campaigns/${campaignId}/negotiations/${negotiationId}/terms/${terms.id}`
        : `/api/campaigns/${campaignId}/negotiations/${negotiationId}/terms`;

      const method = terms ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealTerms),
      });

      if (!response.ok) {
        throw new Error("Failed to save terms");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving terms:", error);
      alert("Failed to save terms. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values or clear if we were creating new
    setDealTerms(terms);
    setIsEditing(false);
  };

  // Handle array field changes (deliverables, requirements)
  const handleArrayFieldChange = (
    field: "deliverables" | "requirements",
    index: number,
    value: string,
  ) => {
    if (!dealTerms) return;

    const updatedArray = [...dealTerms[field]];
    updatedArray[index] = value;
    setDealTerms({ ...dealTerms, [field]: updatedArray });
  };

  const addArrayItem = (field: "deliverables" | "requirements") => {
    if (!dealTerms) return;

    setDealTerms({
      ...dealTerms,
      [field]: [...dealTerms[field], ""],
    });
  };

  const removeArrayItem = (
    field: "deliverables" | "requirements",
    index: number,
  ) => {
    if (!dealTerms || dealTerms[field].length <= 1) return;

    const updatedArray = dealTerms[field].filter((_, i) => i !== index);
    setDealTerms({ ...dealTerms, [field]: updatedArray });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Deal Terms</h2>
        {!isEditing && (
          <div>
            {terms ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={
                  status === "AGREED" ||
                  status === "REJECTED" ||
                  status === "FAILED" ||
                  status === "DONE" ||
                  Boolean(terms.approvedAt)
                }
              >
                Edit Terms
              </button>
            ) : (
              <button
                onClick={handleAddTerms}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={
                  status === "AGREED" ||
                  status === "REJECTED" ||
                  status === "FAILED" ||
                  status === "DONE"
                }
              >
                Add Terms
              </button>
            )}
          </div>
        )}

        {isEditing && (
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

      {!dealTerms && !isEditing ? (
        <div className="py-6 text-center text-gray-500">
          <p>No deal terms have been proposed yet.</p>
          {status !== "AGREED" &&
            status !== "REJECTED" &&
            status !== "FAILED" &&
            status !== "DONE" && (
              <button
                onClick={handleAddTerms}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add Terms
              </button>
            )}
        </div>
      ) : isEditing ? (
        // Edit mode
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fee ($)
            </label>
            <input
              type="number"
              value={dealTerms?.fee || 0}
              onChange={(e) =>
                setDealTerms(
                  dealTerms
                    ? { ...dealTerms, fee: parseFloat(e.target.value) }
                    : null,
                )
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Deliverables
            </label>
            {dealTerms?.deliverables.map((item, index) => (
              <div key={index} className="mb-2 flex">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "deliverables",
                      index,
                      e.target.value,
                    )
                  }
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., 1 Instagram post"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("deliverables", index)}
                  className="ml-2 px-2 text-red-600"
                  disabled={dealTerms.deliverables.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem("deliverables")}
              className="mt-1 text-sm text-blue-600"
            >
              + Add deliverable
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={dealTerms?.timeline.startDate || ""}
                onChange={(e) =>
                  setDealTerms(
                    dealTerms
                      ? {
                          ...dealTerms,
                          timeline: {
                            ...dealTerms.timeline,
                            startDate: e.target.value,
                          },
                        }
                      : null,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={dealTerms?.timeline.endDate || ""}
                onChange={(e) =>
                  setDealTerms(
                    dealTerms
                      ? {
                          ...dealTerms,
                          timeline: {
                            ...dealTerms.timeline,
                            endDate: e.target.value,
                          },
                        }
                      : null,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Requirements
            </label>
            {dealTerms?.requirements.map((item, index) => (
              <div key={index} className="mb-2 flex">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "requirements",
                      index,
                      e.target.value,
                    )
                  }
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., Must include product close-up"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("requirements", index)}
                  className="ml-2 px-2 text-red-600"
                  disabled={dealTerms.requirements.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem("requirements")}
              className="mt-1 text-sm text-blue-600"
            >
              + Add requirement
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Revisions
            </label>
            <input
              type="number"
              min="0"
              value={dealTerms?.revisions || 0}
              onChange={(e) =>
                setDealTerms(
                  dealTerms
                    ? {
                        ...dealTerms,
                        revisions: parseInt(e.target.value),
                      }
                    : null,
                )
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      ) : (
        // View mode
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">Fee</p>
            <p className="text-xl font-medium">
              ${dealTerms?.fee.toLocaleString()}
            </p>
          </div>

          <div className="border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">Deliverables</p>
            <ul className="mt-1 list-disc pl-5">
              {dealTerms?.deliverables.map((item, i) => (
                <li key={i} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">Timeline</p>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Start</p>
                <p className="text-sm">
                  {new Date(
                    dealTerms?.timeline.startDate || "",
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">End</p>
                <p className="text-sm">
                  {new Date(
                    dealTerms?.timeline.endDate || "",
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-2">
            <p className="text-sm text-gray-500">Requirements</p>
            <ul className="mt-1 list-disc pl-5">
              {dealTerms?.requirements.map((item, i) => (
                <li key={i} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-500">Revisions</p>
            <p className="text-sm">{dealTerms?.revisions}</p>
          </div>

          {dealTerms?.approvedAt ? (
            <div className="mt-2 border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-500">
                Approved on{" "}
                {new Date(dealTerms.approvedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            status === "TERMS_PROPOSED" && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <Link
                  href={`/campaigns/${campaignId}/negotiate/${negotiationId}?view=contract`}
                  className="block w-full rounded-md bg-green-600 py-2 text-center text-white hover:bg-green-700"
                >
                  View Contract
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
