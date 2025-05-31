import { auth } from "@/server/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Mock campaign details - in a real app, this would fetch from the database
  const campaignData = {
    "1": {
      id: "1",
      title: "Summer Fitness Challenge",
      description:
        "Promoting our new fitness app with summer workout challenges. We're looking for fitness creators who can demonstrate our app features while engaging their audience with workout challenges. Creators will receive the app for free and compensation for their content.",
      status: "ACTIVE",
      budget: 5000,
      startDate: new Date("2023-06-15"),
      endDate: new Date("2023-08-15"),
      createdAt: new Date("2023-05-20"),
      niches: ["Fitness", "Health", "Lifestyle"],
      location: "US",
      minFollowers: 10000,
      maxFollowers: 500000,
      selectedCreators: [
        {
          id: "c1",
          name: "FitnessPro",
          followers: 250000,
          engagement: 4.5,
          categories: ["Fitness"],
          location: "US",
          status: "Matched",
        },
        {
          id: "c2",
          name: "HealthyLifestyle",
          followers: 180000,
          engagement: 3.8,
          categories: ["Fitness", "Health"],
          location: "US",
          status: "Negotiating",
        },
        {
          id: "c3",
          name: "WorkoutDaily",
          followers: 120000,
          engagement: 5.2,
          categories: ["Fitness"],
          location: "CA",
          status: "Contracted",
        },
      ],
    },
    "2": {
      id: "2",
      title: "Tech Product Launch",
      description:
        "Launching our new smart home device with tech influencers. We need tech-savvy creators who can highlight the innovative features of our smart home system. The content should focus on ease of use, integration with other smart devices, and unique selling points.",
      status: "DRAFT",
      budget: 10000,
      startDate: new Date("2023-07-01"),
      endDate: new Date("2023-09-01"),
      createdAt: new Date("2023-06-10"),
      niches: ["Tech", "Smart Home", "Gadgets"],
      location: "",
      minFollowers: 50000,
      maxFollowers: 1000000,
      selectedCreators: [],
    },
    "3": {
      id: "3",
      title: "Holiday Gift Guide",
      description:
        "Featuring our products in holiday gift recommendations. We want creators to include our products in their holiday gift guides, targeting different demographics. Content should emphasize the gift-worthiness of our products and seasonal relevance.",
      status: "PAUSED",
      budget: 7500,
      startDate: new Date("2023-11-01"),
      endDate: new Date("2023-12-25"),
      createdAt: new Date("2023-09-15"),
      niches: ["Lifestyle", "Fashion", "Beauty"],
      location: "US",
      minFollowers: 25000,
      maxFollowers: 750000,
      selectedCreators: [
        {
          id: "c4",
          name: "StyleGuru",
          followers: 420000,
          engagement: 3.2,
          categories: ["Fashion", "Lifestyle"],
          location: "US",
          status: "Matched",
        },
        {
          id: "c5",
          name: "BeautyExperts",
          followers: 320000,
          engagement: 4.1,
          categories: ["Beauty"],
          location: "UK",
          status: "Matched",
        },
      ],
    },
  };

  const campaign = campaignData[params.id as keyof typeof campaignData];

  // If campaign doesn't exist, show 404
  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/campaigns"
              className="mr-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to Campaigns
            </Link>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <span
              className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${
                campaign.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : campaign.status === "DRAFT"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <div>
            <button className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Edit Campaign
            </button>
            {campaign.status === "DRAFT" ? (
              <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Launch Campaign
              </button>
            ) : campaign.status === "ACTIVE" ? (
              <button className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700">
                Pause Campaign
              </button>
            ) : (
              <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Resume Campaign
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Campaign Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{campaign.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium text-gray-900">
                  ${campaign.budget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {campaign.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">
                  {campaign.startDate.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">
                  {campaign.endDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Targeting Criteria</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Content Niches</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {campaign.niches.map((niche) => (
                  <span
                    key={niche}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {campaign.location || "Any"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Follower Range</p>
              <p className="font-medium text-gray-900">
                {campaign.minFollowers.toLocaleString()} -{" "}
                {campaign.maxFollowers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Campaign Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {campaign.selectedCreators.length}
              </p>
              <p className="text-sm text-blue-600">Creators</p>
            </div>
            <div className="rounded-md bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {
                  campaign.selectedCreators.filter(
                    (c) => c.status === "Contracted",
                  ).length
                }
              </p>
              <p className="text-sm text-green-600">Contracted</p>
            </div>
            <div className="rounded-md bg-yellow-50 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {
                  campaign.selectedCreators.filter(
                    (c) => c.status === "Negotiating",
                  ).length
                }
              </p>
              <p className="text-sm text-yellow-600">Negotiating</p>
            </div>
            <div className="rounded-md bg-purple-50 p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {
                  campaign.selectedCreators.filter(
                    (c) => c.status === "Matched",
                  ).length
                }
              </p>
              <p className="text-sm text-purple-600">Matched</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Creators */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Selected Creators</h2>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Find More Creators
          </button>
        </div>

        {campaign.selectedCreators.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Creator
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Followers
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Engagement
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Categories
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaign.selectedCreators.map((creator) => (
                  <tr key={creator.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                          <div className="flex h-full w-full items-center justify-center bg-blue-100 text-blue-800">
                            {creator.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {creator.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {creator.followers.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <span className="text-green-600">
                        {creator.engagement}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {creator.categories.map((category) => (
                          <span
                            key={category}
                            className="rounded bg-gray-100 px-2 py-1 text-xs"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {creator.location}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          creator.status === "Contracted"
                            ? "bg-green-100 text-green-800"
                            : creator.status === "Negotiating"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {creator.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {creator.status === "Matched" && (
                        <button className="text-blue-600 hover:text-blue-800">
                          Start Negotiation
                        </button>
                      )}
                      {creator.status === "Negotiating" && (
                        <button className="text-blue-600 hover:text-blue-800">
                          View Conversation
                        </button>
                      )}
                      {creator.status === "Contracted" && (
                        <button className="text-blue-600 hover:text-blue-800">
                          View Contract
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No creators selected yet
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Find and select creators that match your campaign criteria
            </p>
            <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Find Creators
            </button>
          </div>
        )}
      </div>

      {/* Voice Negotiation Section */}
      <div className="rounded-md bg-gradient-to-r from-blue-50 to-purple-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-blue-900">
              AI Voice Negotiation
            </h2>
            <p className="mb-2 text-gray-700">
              Let our AI voice agent negotiate with creators on your behalf.
            </p>
          </div>
          <button className="rounded-md bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white hover:from-blue-600 hover:to-purple-700">
            Enable Voice Negotiation
          </button>
        </div>
      </div>
    </div>
  );
}
