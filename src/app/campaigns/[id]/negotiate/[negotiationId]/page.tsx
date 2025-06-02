import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/trpc/server";
import { MessageSender, NegotiationStatus } from "@prisma/client";
import type { Session } from "next-auth";
import NegotiationConversation from "./components/NegotiationConversation";
import NegotiationTermsPanel from "./components/NegotiationTermsPanel";
import NegotiationParametersPanel from "./components/NegotiationParametersPanel";
import ContractPanel from "./components/ContractPanel";

// Define types for the negotiation data
interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  contentType: string;
  emailMetadata?: {
    subject?: string;
    to?: string;
    from?: string;
    messageId?: string;
    inReplyTo?: string;
    [key: string]: unknown;
  };
}

interface Term {
  id: string;
  fee: number;
  deliverables: string[];
  requirements: string[];
  revisions: number;
  timeline: {
    startDate: string;
    endDate: string;
    milestones?: Array<{ date: string; description: string }>;
  };
  approvedAt?: Date | null;
}

interface NegotiationWithDetails {
  id: string;
  creatorId: string;
  creatorEmail: string;
  status: NegotiationStatus;
  createdAt: Date;
  parameters: Record<string, unknown>;
  messages: Message[];
  terms?: Term;
  aiMode: "AUTONOMOUS" | "ASSISTED";
  campaign: {
    title: string;
    brandId: string;
  };
}

export default async function NegotiationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; negotiationId: string }>;
  searchParams: Promise<{ view?: string } | undefined>;
}) {
  // Get auth session and handle errors
  const sessionResult = await auth();
  const session = sessionResult;

  // Extract ids from params to prevent "params should be awaited" error
  const { id, negotiationId } = await params;
  const searchParamsValue = await searchParams;
  const viewParam = searchParamsValue?.view;

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Fetch the negotiation data
  try {
    // Get negotiation by ID
    const negotiation = await db.negotiation.findUnique({
      where: {
        id: negotiationId,
        campaignId: id,
        campaign: {
          brandId: session.user.id,
        },
      },
      include: {
        messages: {
          orderBy: {
            timestamp: "asc",
          },
        },
        terms: true,
        campaign: {
          select: {
            title: true,
            brandId: true,
          },
        },
      },
    });

    if (!negotiation) {
      notFound();
    }

    const typedNegotiation = negotiation as unknown as NegotiationWithDetails;

    // Helper function to format status
    const formatStatus = (status: NegotiationStatus): string => {
      return status.toString().replace(/_/g, " ");
    };

    // Determine which view to show based on searchParams
    const view = viewParam ?? "conversation";

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
            Negotiation with {typedNegotiation.creatorEmail.split("@")[0]}
          </h1>
          <div className="mt-2 flex items-center">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                typedNegotiation.status === "AGREED"
                  ? "bg-green-100 text-green-800"
                  : typedNegotiation.status === "IN_PROGRESS" ||
                      typedNegotiation.status === "TERMS_PROPOSED"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {formatStatus(typedNegotiation.status)}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Started{" "}
              {format(new Date(typedNegotiation.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              href={`/campaigns/${id}/negotiate/${negotiationId}`}
              className={`border-b-2 px-1 pb-4 text-sm font-medium ${
                view === "conversation"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Conversation
            </Link>
            <Link
              href={`/campaigns/${id}/negotiate/${negotiationId}?view=terms`}
              className={`border-b-2 px-1 pb-4 text-sm font-medium ${
                view === "terms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Terms
            </Link>
            <Link
              href={`/campaigns/${id}/negotiate/${negotiationId}?view=parameters`}
              className={`border-b-2 px-1 pb-4 text-sm font-medium ${
                view === "parameters"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Creator Parameters
            </Link>
            <Link
              href={`/campaigns/${id}/negotiate/${negotiationId}?view=contract`}
              className={`border-b-2 px-1 pb-4 text-sm font-medium ${
                view === "contract"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              Contract
            </Link>
          </nav>
        </div>

        {/* Content based on selected view */}
        {view === "conversation" && (
          <NegotiationConversation
            negotiation={typedNegotiation}
            campaignId={id}
          />
        )}

        {view === "terms" && (
          <NegotiationTermsPanel
            terms={typedNegotiation.terms ?? null}
            status={typedNegotiation.status}
            campaignId={id}
            negotiationId={negotiationId}
          />
        )}

        {view === "parameters" && (
          <NegotiationParametersPanel
            negotiation={typedNegotiation}
            campaignId={id}
          />
        )}

        {view === "contract" && (
          <ContractPanel
            negotiationId={negotiationId}
            campaignId={id}
            status={typedNegotiation.status}
          />
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
        </div>
        <p className="text-gray-600">
          No active negotiation found with this creator. You may need to start a
          new negotiation.
        </p>
      </div>
    );
  }
}
