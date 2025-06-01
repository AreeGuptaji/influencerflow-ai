import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/trpc/server";
import { MessageSender, NegotiationStatus } from "@prisma/client";
import { Session } from "next-auth";

// Define types for the negotiation data
interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
}

interface Term {
  fee: number;
  deliverables: string[];
  requirements: string[];
  revisions: number;
}

interface NegotiationWithDetails {
  id: string;
  creatorId: string;
  creatorEmail: string;
  status: NegotiationStatus;
  createdAt: Date;
  messages: Message[];
  terms?: Term;
  campaign: {
    title: string;
    brandId: string;
  };
}

export default async function NegotiationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; creatorId: string }>;
  searchParams?: { view?: string };
}) {
  // Get auth session and handle errors
  const sessionResult = await auth();
  const session = sessionResult as Session | null;

  // Extract ids from params to prevent "params should be awaited" error
  const { id, creatorId } = await params;

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Fetch the negotiation data using the campaign ID and creator ID
  try {
    // Use a try/catch to handle API errors
    let negotiation: NegotiationWithDetails | null = null;

    try {
      const result = await api.negotiation.getNegotiationByCreatorId({
        campaignId: id,
        creatorId: creatorId,
      });

      // Cast the result to our expected type
      negotiation = result as unknown as NegotiationWithDetails;
    } catch (apiError) {
      console.error("API error:", apiError);
      negotiation = null;
    }

    if (!negotiation) {
      notFound();
    }

    // Helper function to format status
    const formatStatus = (status: NegotiationStatus): string => {
      return status.toString().replace(/_/g, " ");
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/campaigns/${id}`}
            className="mb-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to Campaign
          </Link>
          <h1 className="text-2xl font-bold">
            Negotiation with {negotiation.creatorEmail.split("@")[0]}
          </h1>
          <div className="mt-2 flex items-center">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                negotiation.status === "AGREED"
                  ? "bg-green-100 text-green-800"
                  : negotiation.status === "IN_PROGRESS" ||
                      negotiation.status === "TERMS_PROPOSED"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {formatStatus(negotiation.status)}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Started {format(new Date(negotiation.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Messages section */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Conversation</h2>
          <div className="space-y-4">
            {negotiation.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg p-4 ${
                  message.sender === "CREATOR"
                    ? "ml-8 bg-blue-50"
                    : "mr-8 bg-gray-50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">
                    {message.sender === "CREATOR"
                      ? negotiation.creatorEmail.split("@")[0]
                      : message.sender === "BRAND_AI"
                        ? "AI Assistant"
                        : "You"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.timestamp), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms section if available */}
        {negotiation.terms && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Agreed Terms</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Fee</p>
                <p className="font-medium text-gray-900">
                  ${negotiation.terms.fee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revisions</p>
                <p className="font-medium text-gray-900">
                  {negotiation.terms.revisions}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Deliverables</p>
                <ul className="list-inside list-disc">
                  {negotiation.terms.deliverables.map((item, i) => (
                    <li key={i} className="font-medium text-gray-900">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Requirements</p>
                <ul className="list-inside list-disc">
                  {negotiation.terms.requirements.map((item, i) => (
                    <li key={i} className="font-medium text-gray-900">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Reply section */}
        {(negotiation.status === "IN_PROGRESS" ||
          negotiation.status === "TERMS_PROPOSED") && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Send Reply</h2>
            <form
              action={`/api/campaigns/${id}/negotiations/${negotiation.id}/reply`}
              method="POST"
            >
              <div className="mb-4">
                <label
                  htmlFor="subject"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full rounded-md border border-gray-300 p-2"
                  defaultValue={`Re: ${negotiation.campaign.title} Campaign`}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="body"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={5}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Type your reply here..."
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/campaigns/${id}`}
            className="mb-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to Campaign
          </Link>
          <h1 className="text-2xl font-bold">Negotiation Not Found</h1>
          <p className="mt-2 text-gray-600">
            No active negotiation found with this creator. You may need to start
            a new negotiation.
          </p>
        </div>
      </div>
    );
  }
}
