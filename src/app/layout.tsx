import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "InfluencerFlow AI",
  description: "AI-powered influencer marketing platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

async function NavBar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <span className="ml-2 font-semibold">InfluencerFlow</span>
        </Link>

        {session?.user && (
          <>
            <Link
              href="/database"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Database
            </Link>
            <Link
              href="/campaigns"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Campaigns
            </Link>
          </>
        )}
      </div>

      <div>
        {session?.user ? (
          <Link
            href="/api/auth/signout"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Sign Out
          </Link>
        ) : (
          <Link
            href="/api/auth/signin"
            className="rounded-md bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-700"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <NavBar />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
