"use client";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Campaign schema for reference:
// title: string
// description: string
// budget: number
// startDate: Date
// endDate: Date
// niches: string[]
// location?: string
// minFollowers?: number
// maxFollowers?: number

export default function CreateCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const utils = api.useUtils();
  const mutation = api.campaign.create.useMutation({
    onSuccess: async () => {
      await utils.campaign.invalidate();
      router.push("/campaigns");
    },
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = e.target;

    if (type === "select-multiple") {
      const selectElement = e.target as HTMLSelectElement;
      const selected: string[] = [];

      for (const option of Array.from(selectElement.options)) {
        if (option.selected) selected.push(option.value);
      }

      setForm((f) => ({ ...f, [name]: selected }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validate and transform data for schema
    try {
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.description || form.description.length < 10)
        throw new Error("Description must be at least 10 characters");
      if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) < 1)
        throw new Error("Budget must be at least $1");
      if (!form.startDate) throw new Error("Start date is required");
      if (!form.endDate) throw new Error("End date is required");
      if (!form.niches.length)
        throw new Error("At least one niche is required");

      const payload = {
        title: form.title,
        description: form.description,

        budget: Number(form.budget),
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        niches: form.niches,
        location: form.location || undefined,
        minFollowers: form.minFollowers ? Number(form.minFollowers) : undefined,
        maxFollowers: form.maxFollowers ? Number(form.maxFollowers) : undefined,
      };

      mutation.mutate(payload);
    } catch (err) {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="mb-4 flex items-center">
          <Link
            href="/campaigns"
            className="mr-2 text-blue-600 hover:text-blue-800"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold">Create New Campaign</h1>
        </div>
        <p className="text-gray-600">
          Set up your campaign details and targeting criteria to find the
          perfect creators
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Campaign Details Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Campaign Details</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Campaign Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Summer Product Launch"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="budget"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Budget (USD) *
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={form.budget}
                  onChange={handleNumberChange}
                  placeholder="5000"
                  min="1"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Campaign Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your campaign goals, products, and what you're looking for from creators..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Targeting Criteria Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Creator Targeting</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="niches"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Content Niches *
                </label>
                <select
                  id="niches"
                  name="niches"
                  multiple
                  value={form.niches}
                  onChange={handleChange}
                  className="h-32 w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="AI">AI</option>
                  <option value="Tech">Tech</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Gaming">Gaming</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple niches
                </p>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <select
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Any Location</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="minFollowers"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Minimum Followers
                </label>
                <input
                  type="number"
                  id="minFollowers"
                  name="minFollowers"
                  value={form.minFollowers}
                  onChange={handleNumberChange}
                  placeholder="10000"
                  min="0"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="maxFollowers"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Maximum Followers
                </label>
                <input
                  type="number"
                  id="maxFollowers"
                  name="maxFollowers"
                  value={form.maxFollowers}
                  onChange={handleNumberChange}
                  placeholder="1000000"
                  min="0"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Voice Negotiation Section (Future Feature) */}
          <div className="rounded-md bg-blue-50 p-4">
            <h3 className="mb-2 text-lg font-medium text-blue-800">
              Voice Negotiation
            </h3>
            <p className="mb-2 text-sm text-blue-700">
              Our AI voice agents will negotiate with creators on your behalf
              based on your campaign details
            </p>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableVoice"
                name="enableVoice"
                className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                disabled
              />
              <label
                htmlFor="enableVoice"
                className="ml-2 text-sm text-blue-700"
              >
                Enable AI Voice Negotiation (Coming Soon)
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/campaigns"
              className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Campaign"}
            </button>
          </div>
          {error && (
            <div className="mt-4 rounded bg-red-100 px-4 py-2 text-red-700">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
