"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<"CREATOR" | "BRAND" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const setRoleMutation = api.user.setRole.useMutation({
    onSuccess: () => {
      // Redirect to profile setup based on role
      if (selectedRole === "CREATOR") {
        router.push("/onboarding/creator-profile");
      } else if (selectedRole === "BRAND") {
        router.push("/onboarding/brand-profile");
      }
    },
    onError: (error) => {
      console.error("Error setting role:", error);
      setIsLoading(false);
    },
  });

  const handleRoleSelection = async (role: "CREATOR" | "BRAND") => {
    setSelectedRole(role);
    setIsLoading(true);
    setRoleMutation.mutate({ role });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">
            Welcome to InfluencerFlow AI
          </h1>
          <p className="text-xl text-gray-300">
            Choose your role to get started with the ultimate AI-powered
            platform
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Creator Option */}
          <div
            onClick={() => !isLoading && handleRoleSelection("CREATOR")}
            className={`cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/20 ${selectedRole === "CREATOR" ? "ring-4 ring-green-400" : ""} ${isLoading ? "cursor-not-allowed opacity-50" : ""} `}
          >
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500">
                <span className="text-4xl">🎬</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white">Creator</h2>
              <p className="mb-6 leading-relaxed text-gray-300">
                I&apos;m a content creator looking to grow my audience, get
                brand partnerships, and monetize my content with AI-powered
                insights.
              </p>
              <ul className="space-y-2 text-left text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Growth analytics & insights
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Brand collaboration opportunities
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Content optimization tools
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-400">✓</span>
                  Campaign management
                </li>
              </ul>
            </div>
          </div>

          {/* Brand Option */}
          <div
            onClick={() => !isLoading && handleRoleSelection("BRAND")}
            className={`cursor-pointer rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/20 ${selectedRole === "BRAND" ? "ring-4 ring-blue-400" : ""} ${isLoading ? "cursor-not-allowed opacity-50" : ""} `}
          >
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                <span className="text-4xl">🏢</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white">Brand</h2>
              <p className="mb-6 leading-relaxed text-gray-300">
                I represent a brand or agency looking to discover creators,
                manage campaigns, and track performance with AI assistance.
              </p>
              <ul className="space-y-2 text-left text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-400">✓</span>
                  Creator discovery & search
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-400">✓</span>
                  Campaign creation & management
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-400">✓</span>
                  Performance analytics
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-400">✓</span>
                  Automated outreach tools
                </li>
              </ul>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center text-white">
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
              Setting up your account...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
