import { auth } from "@/server/auth";
import Link from "next/link";

async function AuthButtons() {
  const session = await auth();

  if (session?.user) {
    // User is signed in - show dashboard button
    return (
      <div className="flex items-center justify-center">
        <Link
          href="/campaigns"
          className="transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-700"
        >
          Find Creators!
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
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-24 text-center">
        <h1 className="mb-8 text-5xl leading-tight font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Connect with the{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Perfect Creators
          </span>
          <br />
          for Your Brand
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-300">
          InfluencerFlow AI revolutionizes influencer marketing with
          voice-powered negotiation and AI-driven creator matching.
        </p>

        {/* CTA Buttons */}
        <div className="mb-16">
          <AuthButtons />
        </div>

        {/* Feature Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          <div className="transform rounded-xl bg-white/10 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/80 text-2xl shadow-lg">
              🔍
            </div>
            <h3 className="mb-4 text-2xl font-semibold">AI Creator Matching</h3>
            <p className="text-gray-300">
              Our AI analyzes creator content and engagement to find perfect
              matches for your brand.
            </p>
          </div>

          <div className="transform rounded-xl bg-white/10 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/80 text-2xl shadow-lg">
              🎙️
            </div>
            <h3 className="mb-4 text-2xl font-semibold">Voice Negotiation</h3>
            <p className="text-gray-300">
              Revolutionary AI voice agents handle negotiations in real-time
              with creators.
            </p>
          </div>

          <div className="transform rounded-xl bg-white/10 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/80 text-2xl shadow-lg">
              📊
            </div>
            <h3 className="mb-4 text-2xl font-semibold">Campaign Analytics</h3>
            <p className="text-gray-300">
              Track performance metrics and ROI with detailed campaign
              analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="w-full bg-gray-900/80 py-16 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-10 text-3xl font-bold tracking-tight">
            Trusted by Innovative Brands
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-10 opacity-80">
            {/* Placeholder for brand logos */}
            <div className="h-14 w-36 rounded-lg bg-white/20 shadow-md transition-all duration-200 hover:bg-white/30"></div>
            <div className="h-14 w-36 rounded-lg bg-white/20 shadow-md transition-all duration-200 hover:bg-white/30"></div>
            <div className="h-14 w-36 rounded-lg bg-white/20 shadow-md transition-all duration-200 hover:bg-white/30"></div>
            <div className="h-14 w-36 rounded-lg bg-white/20 shadow-md transition-all duration-200 hover:bg-white/30"></div>
            <div className="h-14 w-36 rounded-lg bg-white/20 shadow-md transition-all duration-200 hover:bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#15162c] py-10">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© 2025 InfluencerFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
