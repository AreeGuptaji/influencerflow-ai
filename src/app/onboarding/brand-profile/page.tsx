"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

const INDUSTRY_OPTIONS = [
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Technology",
  "Food & Beverage",
  "Travel & Hospitality",
  "Fitness & Wellness",
  "Home & Garden",
  "Automotive",
  "Entertainment",
  "Education",
  "Finance",
  "Healthcare",
  "Real Estate",
  "Sports & Recreation",
  "Gaming",
  "SaaS & Software",
  "E-commerce",
  "Other",
];

export default function BrandProfilePage() {
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    website: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateProfileMutation = api.user.updateBrandProfile.useMutation({
    onSuccess: () => {
      router.push("/campaigns");
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      alert("Company name is required");
      return;
    }

    setIsLoading(true);
    updateProfileMutation.mutate({
      companyName: formData.companyName,
      industry: formData.industry || undefined,
      website: formData.website || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Complete Your Brand Profile
          </h1>
          <p className="text-xl text-gray-300">
            Tell creators about your brand to attract the perfect partnerships
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md"
        >
          {/* Company Name */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
              placeholder="e.g., Nike, Apple, Coca-Cola"
              className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              required
            />
          </div>

          {/* Industry */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Industry
            </label>
            <select
              value={formData.industry}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, industry: e.target.value }))
              }
              className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white"
            >
              <option value="" className="bg-gray-800">
                Select an industry
              </option>
              {INDUSTRY_OPTIONS.map((industry) => (
                <option key={industry} value={industry} className="bg-gray-800">
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="https://yourcompany.com"
              className="w-full rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="mb-3 block text-lg font-semibold text-white">
              Company Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Tell creators about your brand, mission, values, and what makes you unique. What kind of content partnerships are you looking for?"
              className="w-full resize-none rounded-lg border border-white/30 bg-white/20 p-4 text-white placeholder-gray-300"
              rows={6}
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || !formData.companyName.trim()}
              className={`rounded-lg px-8 py-4 text-lg font-semibold transition-all duration-200 ${
                isLoading || !formData.companyName.trim()
                  ? "cursor-not-allowed bg-gray-500"
                  : "transform bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 hover:from-blue-600 hover:to-purple-600"
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

          {/* What's Next Info */}
          <div className="mt-8 rounded-lg border border-blue-400/30 bg-blue-500/20 p-6">
            <h3 className="mb-3 font-semibold text-white">What&apos;s Next?</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">→</span>
                View your campaigns dashboard
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">→</span>
                Create your first influencer campaign
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">→</span>
                Search and connect with creators
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">→</span>
                Track campaign performance
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
