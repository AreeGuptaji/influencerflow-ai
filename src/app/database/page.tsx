"use client";

import { api } from "@/trpc/react";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TRPCClientError } from "@trpc/client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function DatabasePage() {
  const router = useRouter();

  // Use a state to store the creators data after fetching
  const [creators, setCreators] = useState<
    Array<{
      id: string;

      username: string | null;
      email: string | null;
      bio: string | null;
      niches: string[];
      followerCount: number | null;
      platforms: string[];
      location: string | null;
      engagementRate: number | null;
      recentContent: string[];
      contactInfo: string | null;
    }>
  >([]);

  // Fetch creators data with React Query with error handling
  const creatorsQuery = api.creator.getAll.useQuery();

  // Log any errors for debugging
  useEffect(() => {
    if (creatorsQuery.error) {
      console.error("Error fetching creators:", creatorsQuery.error);
    }
  }, [creatorsQuery]);

  // Update creators state when data is available
  useEffect(() => {
    if (creatorsQuery.data) {
      // Transform the data to match the expected format in the component
      const formattedCreators = creatorsQuery.data.map((creator) => ({
        ...creator,
        followers: creator.followerCount ?? 0,
        engagement: creator.engagementRate ?? 0,
        views: 0, // This field isn't in the schema, so defaulting to 0
        categories: creator.niches,
        // contact: creator.email ?? creator.contactInfo ?? "No contact",
      }));
      setCreators(formattedCreators);
    }
  }, [creatorsQuery.data]);

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Sheet state
  const [open, setOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<
    (typeof creators)[0] | null
  >(null);

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch = creator.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategories =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => creator.niches.includes(cat));
    return matchesSearch && matchesCategories;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCreators.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle row click to open sheet
  const handleRowClick = (creator: (typeof creators)[0]) => {
    setSelectedCreator(creator);
    setOpen(true);
  };

  // Render error handling UI if there's an error
  if (creatorsQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading creators
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {creatorsQuery.error.message}
              </div>
              <div className="mt-2 text-xs text-red-700">
                <pre>{JSON.stringify(creatorsQuery.error, null, 2)}</pre>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => creatorsQuery.refetch()}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading indicator
  if (creatorsQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading creators data...</p>
        </div>
      </div>
    );
  }

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
              value={searchTerm}
              onChange={handleSearchChange}
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
                selectedCategories.includes(category)
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => handleCategoryClick(category)}
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
            {currentItems.map((creator) => (
              <tr
                key={creator.username}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(creator)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
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
                        A
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">
                        {creator.name ?? "Jackson"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {(creator.followerCount ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {creator.engagementRate}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">{200}</td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {creator.niches.map((category: string) => (
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
                  {creator.email}
                </td>
                <td
                  className="px-4 py-4 text-right text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-600">
                        &gt;
                      </button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>
                          {selectedCreator
                            ? selectedCreator.name
                            : "Creator Details"}
                        </SheetTitle>
                        <SheetDescription>
                          {selectedCreator && (
                            <div className="mt-4 flex flex-col gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                                  {/* Replace with <img> or <Image> if needed */}
                                  <span className="text-2xl text-blue-800">
                                    A
                                  </span>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold">
                                    {selectedCreator.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {selectedCreator.location}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="mb-2">
                                  <span className="font-medium">
                                    Followers:
                                  </span>{" "}
                                  {selectedCreator.followerCount}
                                </div>
                                <div className="mb-2">
                                  <span className="font-medium">
                                    Engagement:
                                  </span>{" "}
                                  {selectedCreator.engagementRate}
                                </div>
                                <div className="mb-2">
                                  <span className="font-medium">Views:</span>{" "}
                                  {200}
                                </div>
                                <div className="mb-2">
                                  <span className="font-medium">
                                    Categories:
                                  </span>{" "}
                                  {selectedCreator.niches.map((cat: string) => (
                                    <span
                                      key={cat}
                                      className="mr-1 inline-block rounded bg-gray-100 px-2 py-1 text-xs"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                                <div className="mb-2">
                                  <span className="font-medium">Contact:</span>{" "}
                                  <span className="text-blue-600">
                                    {selectedCreator.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </SheetDescription>
                      </SheetHeader>
                    </SheetContent>
                  </Sheet>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {currentItems.length} of {filteredCreators.length} creators
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`mx-1 rounded px-3 py-1 ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
