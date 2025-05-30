import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Link from "next/link";

async function AuthButtons() {
  const session = await auth();

  if (session?.user) {
    // User is signed in - show dashboard and sign out buttons
    return (
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/dashboard"
          className="transform rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-blue-600"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/api/auth/signout"
          className="transform rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-gray-600 hover:to-gray-700"
        >
          Sign Out
        </Link>
      </div>
    );
  }

  // User is not signed in - show sign in button
  return (
    <Link
      href="/api/auth/signin"
      className="transform rounded-lg bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-blue-600"
    >
      Get Started
    </Link>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="flex max-w-md flex-col items-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold">InfluencerFlow-AI</h1>
          <div className="mb-6 -rotate-2 transform rounded-md bg-yellow-500 px-4 py-2 text-black">
            <p className="text-lg font-bold">🚀 Ready to Launch 🚀</p>
          </div>
          <p className="mb-4 text-lg">
            The ultimate AI-powered platform for influencer content creation and
            brand partnerships.
          </p>
          <p className="mb-6 text-sm opacity-75">
            Connect creators with brands through intelligent matching and
            seamless collaboration tools.
          </p>

          {session?.user && (
            <div className="mb-4 rounded-lg border border-green-400/30 bg-green-500/20 p-4">
              <p className="mb-2 text-green-300">
                Welcome back, {session.user.name}!
              </p>
              <p className="text-sm text-green-200">
                Ready to continue your journey?
              </p>
            </div>
          )}

          {/* Auth Buttons */}
          <AuthButtons />
        </div>
      </main>
    </HydrateClient>
  );
}
