import { auth } from "@/server/auth";
import Link from "next/link";
import Image from "next/image";

async function AuthButtons() {
  const session = await auth();

  if (session?.user) {
    // User is signed in - show dashboard button
    return (
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/campaigns"
          className="transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-700"
        >
          View Campaigns
        </Link>
      </div>
    );
  }

  // User is not signed in - show sign in button
  return (
    <Link
      href="/api/auth/signin"
      className="transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-700"
    >
      Get Started
    </Link>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-6 text-5xl leading-tight font-bold sm:text-6xl">
          Connect with the{" "}
          <span className="text-blue-400">Perfect Creators</span>
          <br />
          for Your Brand
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-300">
          InfluencerFlow AI revolutionizes influencer marketing with
          voice-powered negotiation and AI-driven creator matching.
        </p>

        {/* CTA Buttons */}
        <div className="mb-12">
          <AuthButtons />
        </div>

        {/* Feature Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
              🔍
            </div>
            <h3 className="mb-2 text-xl font-semibold">AI Creator Matching</h3>
            <p className="text-gray-300">
              Our AI analyzes creator content and engagement to find perfect
              matches for your brand.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
              🎙️
            </div>
            <h3 className="mb-2 text-xl font-semibold">Voice Negotiation</h3>
            <p className="text-gray-300">
              Revolutionary AI voice agents handle negotiations in real-time
              with creators.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
              📊
            </div>
            <h3 className="mb-2 text-xl font-semibold">Campaign Analytics</h3>
            <p className="text-gray-300">
              Track performance metrics and ROI with detailed campaign
              analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="w-full bg-gray-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-8 text-3xl font-bold">
            Trusted by Innovative Brands
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            {/* Placeholder for brand logos */}
            <div className="h-12 w-32 rounded-md bg-white/20"></div>
            <div className="h-12 w-32 rounded-md bg-white/20"></div>
            <div className="h-12 w-32 rounded-md bg-white/20"></div>
            <div className="h-12 w-32 rounded-md bg-white/20"></div>
            <div className="h-12 w-32 rounded-md bg-white/20"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#15162c] py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© 2023 InfluencerFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
