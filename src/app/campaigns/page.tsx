import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CampaignsPage() {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Mock campaigns data
  const campaigns = [
    {
      id: "1",
      title: "Summer Fitness Challenge",
      description:
        "Promoting our new fitness app with summer workout challenges",
      status: "ACTIVE",
      budget: 5000,
      startDate: new Date("2023-06-15"),
      endDate: new Date("2023-08-15"),
      createdAt: new Date("2023-05-20"),
      creatorsMatched: 8,
    },
    {
      id: "2",
      title: "Tech Product Launch",
      description: "Launching our new smart home device with tech influencers",
      status: "DRAFT",
      budget: 10000,
      startDate: new Date("2023-07-01"),
      endDate: new Date("2023-09-01"),
      createdAt: new Date("2023-06-10"),
      creatorsMatched: 0,
    },
    {
      id: "3",
      title: "Holiday Gift Guide",
      description: "Featuring our products in holiday gift recommendations",
      status: "PAUSED",
      budget: 7500,
      startDate: new Date("2023-11-01"),
      endDate: new Date("2023-12-25"),
      createdAt: new Date("2023-09-15"),
      creatorsMatched: 5,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link
          href="/campaigns/create"
          className="rounded-md bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-white hover:from-blue-600 hover:to-purple-700"
        >
          Create Campaign
        </Link>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {campaign.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
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
              <p className="text-sm text-gray-600">{campaign.description}</p>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="font-medium text-gray-900">
                    ${campaign.budget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creators</p>
                  <p className="font-medium text-gray-900">
                    {campaign.creatorsMatched}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">
                    {campaign.startDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">
                    {campaign.endDate.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View Details
                </Link>
                <span className="text-xs text-gray-500">
                  Created {campaign.createdAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-3xl">
            📣
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No campaigns yet
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Get started by creating your first influencer marketing campaign
          </p>
          <Link
            href="/campaigns/create"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
