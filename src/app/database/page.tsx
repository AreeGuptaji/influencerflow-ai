import { api } from "@/trpc/server";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DatabasePage() {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // We'll create a mock creators list for now
  const creators = [
    {
      id: "1",
      name: "Intellipaat",
      followers: 11100000,
      engagement: 2.0,
      views: 6485,
      categories: ["AI"],
      location: "IN",
      contact: "sales@intellipaat.com",
      image: "/creators/intellipaat.jpg",
    },
    {
      id: "2",
      name: "CodeWithHarry",
      followers: 6820000,
      engagement: 6.0,
      views: 49759,
      categories: ["AI"],
      location: "IN",
      contact: "harry@codewithharry.com",
      image: "/creators/codewithharry.jpg",
    },
    {
      id: "3",
      name: "Marques Brownlee",
      followers: 6251743,
      engagement: null,
      views: 17223782,
      categories: ["Tech", "AI"],
      location: "NYC",
      contact: "DM Only",
      image: "/creators/mkbhd.jpg",
    },
    {
      id: "4",
      name: "Apna College",
      followers: 6110000,
      engagement: 5.0,
      views: 18080,
      categories: ["AI"],
      location: "—",
      contact: "apnacollege.ak@gmail.com",
      image: "/creators/apnacollege.jpg",
    },
    {
      id: "5",
      name: "Matty McTech",
      followers: 5200000,
      engagement: 10.0,
      views: 108450,
      categories: ["Lifestyle", "Tech"],
      location: "US",
      contact: "setupspawn@gmail.com",
      image: "/creators/mattymctech.jpg",
    },
  ];

  // Temporary placeholder for category filter buttons
  const categories = [
    "AI",
    "Student",
    "Productivity",
    "Tech",
    "Fitness",
    "Travel",
    "Crypto",
    "Developer",
    "Lifestyle",
    "Business",
    "Home",
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">Creator Database</h1>

        {/* Filters Row */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
            All Platforms
          </button>
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
            All Followers
          </button>
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
            All Engagement
          </button>
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
            All Views
          </button>
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
            All Contacts
          </button>
          <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
            All Locations
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by username, bio, or keywords..."
              className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400">
              🔍
            </span>
          </div>
          <button className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium">
            Search
          </button>
          <button className="rounded-md bg-blue-500 px-4 py-2 font-medium text-white">
            Apply Filters
          </button>
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`rounded-full px-4 py-2 text-sm ${
                category === "AI"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                />
              </th>
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
                Views
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
                Contact
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-sm font-medium text-gray-500"
              ></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {creators.map((creator) => (
              <tr key={creator.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {/* Will replace with actual images later */}
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
                  {creator.engagement ? (
                    <span className="text-green-600">
                      {creator.engagement.toFixed(1)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {creator.views.toLocaleString()}
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
                <td className="px-4 py-4 text-sm text-blue-600">
                  {creator.contact}
                </td>
                <td className="px-4 py-4 text-right text-sm">
                  <button className="text-gray-400 hover:text-gray-600">
                    &gt;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing 5 of 1,063 creators
      </div>
    </div>
  );
}
