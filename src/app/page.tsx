import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="flex max-w-md flex-col items-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold">InfluencerFlow-AI</h1>
          <div className="mb-6 -rotate-2 transform rounded-md bg-yellow-500 px-4 py-2 text-black">
            <p className="text-lg font-bold">🚧 Build in Progress 🚧</p>
          </div>
          <p className="mb-4 text-lg">
            We&apos;re working hard to bring you the ultimate AI-powered
            platform for influencer content creation and management.
          </p>
          <p className="text-sm opacity-75">Check back soon for updates!</p>
        </div>
      </main>
    </HydrateClient>
  );
}
