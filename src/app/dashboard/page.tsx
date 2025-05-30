"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

export default function Dashboard() {
  const router = useRouter();
  const { data: user, isLoading, error } = api.user.getProfile.useQuery();

  useEffect(() => {
    if (!isLoading) {
      if (error || !user) {
        // If there's an error or no user, redirect to sign in
        router.push("/api/auth/signin");
      } else if (!user.onboardingComplete) {
        // If onboarding is not complete, redirect to onboarding
        router.push("/onboarding");
      } else if (user.role === "CREATOR") {
        // Redirect to creator dashboard
        router.push("/dashboard/creator");
      } else if (user.role === "BRAND") {
        // Redirect to brand dashboard
        router.push("/dashboard/brand");
      } else {
        // No role set, redirect to onboarding
        router.push("/onboarding");
      }
    }
  }, [user, isLoading, error, router]);

  // Show loading state while we're determining where to redirect
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold">Loading your dashboard...</h1>
        <div className="mx-auto mt-4 h-2 w-32 animate-pulse rounded-full bg-white/50"></div>
      </div>
    </div>
  );
}
