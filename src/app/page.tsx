import { auth } from "@/server/auth";
import Link from "next/link";
import { Search, Mic, BarChart3, ArrowRight } from "lucide-react";

// SVG Brand Logos components
const AppleLogo = () => (
  <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.25 2c.57.09 1.3.53 1.72.95 1.24 1.24.95 3.2-.29 4.44-.96 1.01-2.46 1.39-3.82.58.52-1.54 1.49-2.82 2.39-3.97zm1.06 6.01c.91.88 1.27 1.9 1.29 2.5.02.78-.28 1.59-.75 2.24-.46.65-1.81 2.05-3.17 2.05-1.26 0-1.61-.79-3.01-.79-1.42 0-1.84.79-3.03.84-1.2.05-2.12-.76-3.19-2.03-2.2-2.65-2.44-5.8-1.08-7.47.97-1.17 2.36-1.75 3.55-1.75 1.6 0 2.26.79 3.41.79 1.12 0 1.8-.86 3.42-.86.98 0 2.25.41 3.07 1.25-2.96.51-2.48 3.94.49 3.23z" />
  </svg>
);

const MicrosoftLogo = () => (
  <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
  </svg>
);

const GoogleLogo = () => (
  <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AmazonLogo = () => (
  <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.63 12.52C15.55 11.3 15.5 9.76 14.51 8.65 13.78 7.79 12.7 7.35 11.58 7.35 10.8 7.35 10.03 7.58 9.37 8.02 7.69 9.13 7.53 11.06 9.02 12.38 9.72 13 10.61 13.31 11.53 13.31 12.52 13.31 13.72 13.05 14.63 12.52zM12.32 19.97C9.32 19.97 6.28 19.57 3.53 18.62 3.19 18.47 2.78 18.67 2.66 19.02 2.53 19.38 2.73 19.77 3.1 19.9 6.09 20.94 9.42 21.37 12.69 21.37 16.64 21.37 20.16 20.43 23.3 18.73 23.65 18.53 23.79 18.11 23.58 17.77 23.38 17.44 22.96 17.31 22.61 17.51 19.71 19.05 16.46 19.97 12.32 19.97zM15.39 13.5C14.57 14.17 13.58 14.54 12.58 14.54 11.4 14.54 10.21 14.14 9.27 13.34 7.25 11.64 7.35 8.99 9.56 7.48 10.42 6.85 11.5 6.54 12.6 6.54 14.06 6.54 15.46 7.11 16.35 8.14 17.72 9.73 17.28 11.96 15.39 13.5zM20.35 7.31C20.06 7.09 19.67 7.16 19.45 7.44 19.23 7.72 19.29 8.11 19.58 8.33 20.27 8.85 20.6 9.61 20.6 10.43 20.6 11.63 19.92 12.73 18.82 13.36 18.5 13.54 18.39 13.92 18.57 14.24 18.67 14.44 18.89 14.55 19.1 14.55 19.22 14.55 19.33 14.52 19.44 14.46 20.94 13.58 21.89 12.08 21.89 10.43 21.89 9.26 21.38 8.15 20.35 7.31z" />
  </svg>
);

const NetflixLogo = () => (
  <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 2v20h2v-9.196l2 6.976c0.844 2.772 1.215 2.22 2.985 2.22 1.899 0 2.921.523 3.015-2.22l2-7v9.22h2v-20h-4.677c-2.618 0-2.25-.337-2.323 1l-1.5 7.5-1.5-7.5c-.168-1.32.681-1 -2.323-1z" />
  </svg>
);

async function AuthButtons() {
  const session = await auth();

  if (session?.user) {
    // User is signed in - show dashboard button
    return (
      <Link
        href="/campaigns"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:outline-none"
      >
        Find Creators! <ArrowRight className="h-5 w-5" />
      </Link>
    );
  }

  // User is not signed in - show sign in button
  return (
    <Link
      href="/api/auth/signin"
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:outline-none"
    >
      Get Started <ArrowRight className="h-5 w-5" />
    </Link>
  );
}

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Connect with the{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Perfect Creators
          </span>
          <br />
          for Your Brand
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
          InfluencerFlow AI revolutionizes influencer marketing with
          voice-powered negotiation and AI-driven creator matching.
        </p>

        {/* CTA Button */}
        <div className="mb-16">
          <AuthButtons />
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          <div className="group rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl sm:p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/80 text-white shadow-md transition-all duration-300 group-hover:shadow-lg">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold md:text-2xl">
              AI Creator Matching
            </h3>
            <p className="text-base leading-relaxed text-gray-300">
              Our AI analyzes creator content and engagement to find perfect
              matches for your brand.
            </p>
          </div>

          <div className="group rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl sm:p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/80 text-white shadow-md transition-all duration-300 group-hover:shadow-lg">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold md:text-2xl">
              Voice Negotiation
            </h3>
            <p className="text-base leading-relaxed text-gray-300">
              Revolutionary AI voice agents handle negotiations in real-time
              with creators.
            </p>
          </div>

          <div className="group rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl sm:p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/80 text-white shadow-md transition-all duration-300 group-hover:shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold md:text-2xl">
              Campaign Analytics
            </h3>
            <p className="text-base leading-relaxed text-gray-300">
              Track performance metrics and ROI with detailed campaign
              analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="w-full bg-gray-900/60 py-12 backdrop-blur-sm sm:py-16">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
            Trusted by Innovative Brands
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {/* Actual brand logos instead of empty placeholders */}
            <div className="flex h-16 items-center justify-center rounded-lg px-4 text-white/70 transition-all duration-200 hover:text-white/90">
              <AppleLogo />
            </div>
            <div className="flex h-16 items-center justify-center rounded-lg px-4 text-white/70 transition-all duration-200 hover:text-white/90">
              <GoogleLogo />
            </div>
            <div className="flex h-16 items-center justify-center rounded-lg px-4 text-white/70 transition-all duration-200 hover:text-white/90">
              <MicrosoftLogo />
            </div>
            <div className="flex h-16 items-center justify-center rounded-lg px-4 text-white/70 transition-all duration-200 hover:text-white/90">
              <AmazonLogo />
            </div>
            <div className="flex h-16 items-center justify-center rounded-lg px-4 text-white/70 transition-all duration-200 hover:text-white/90">
              <NetflixLogo />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#15162c] py-8 sm:py-10">
        <div className="container mx-auto px-4 text-center text-gray-400 sm:px-6">
          <p className="text-sm">
            © 2025 InfluencerFlow AI. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
