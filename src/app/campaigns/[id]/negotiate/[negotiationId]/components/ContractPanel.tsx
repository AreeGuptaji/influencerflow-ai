"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NegotiationStatus } from "@prisma/client";
import Link from "next/link";
import { Loader2, FileText, Download, Send, Pencil } from "lucide-react";

interface ContractData {
  id: string;
  content: string;
  status: string;
  version: number;
  signedByBrand: boolean;
  signedByCreator: boolean;
  brandSignedAt?: Date;
  creatorSignedAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ContractPanel({
  negotiationId,
  campaignId,
  status,
}: {
  negotiationId: string;
  campaignId: string;
  status: NegotiationStatus;
}) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  // Fetch contract data
  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/contracts?negotiationId=${negotiationId}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          setContract(null);
        } else {
          throw new Error(`Error fetching contract: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setContract(data.contract);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contract");
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate contract
  const generateContract = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ negotiationId }),
      });

      if (!response.ok) {
        throw new Error(`Error generating contract: ${response.statusText}`);
      }

      await fetchContract();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate contract",
      );
    } finally {
      setGenerating(false);
    }
  };

  // Send contract to creator
  const sendToCreator = async () => {
    if (!contract) return;

    setSending(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Error sending contract: ${response.statusText}`);
      }

      await fetchContract();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send contract");
    } finally {
      setSending(false);
    }
  };

  // Download contract as PDF
  const downloadPdf = async () => {
    if (!contract) return;

    try {
      window.open(`/api/contracts/${contract.id}/pdf`, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    }
  };

  useEffect(() => {
    fetchContract();
  }, [negotiationId, campaignId]);

  // Format contract status for display
  const formatStatus = (status: string): string => {
    return status.replace(/_/g, " ");
  };

  // Render markdown content as HTML
  const renderMarkdown = (content: string): string => {
    // Very simple markdown rendering (a more robust solution would use a markdown library)
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold my-3">$1</h2>')
      .replace(/\n\n/g, '<div class="my-2"></div>')
      .replace(/\n/g, "<br />");
  };

  const canGenerateContract =
    status === "AGREED" || status === "TERMS_PROPOSED";

  const canEditContract =
    contract &&
    contract.status === "DRAFT" &&
    !contract.signedByCreator &&
    !contract.signedByBrand;

  const canSendContract =
    contract && contract.status === "DRAFT" && !contract.signedByCreator;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchContract}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Contract</h2>
        </div>

        <div className="py-8 text-center">
          <p className="mb-4 text-gray-600">
            No contract has been generated yet.
          </p>

          {canGenerateContract && (
            <button
              onClick={generateContract}
              disabled={generating}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate Contract</>
              )}
            </button>
          )}

          {!canGenerateContract && (
            <p className="text-sm text-gray-500">
              A contract can be generated once terms have been proposed or
              agreed upon.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Contract</h2>
          <span className="ml-3 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
            {formatStatus(contract.status)}
          </span>
        </div>

        <div className="flex space-x-3">
          {canEditContract && (
            <Link
              href={`/campaigns/${campaignId}/contracts/${contract.id}/edit`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Link>
          )}

          <button
            onClick={downloadPdf}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Download className="mr-1 h-4 w-4" />
            Download PDF
          </button>

          {canSendContract && (
            <button
              onClick={sendToCreator}
              disabled={sending}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" />
                  Send to Creator
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-500">
        <p>
          Version {contract.version} • Created on{" "}
          {new Date(contract.createdAt).toLocaleDateString()}
        </p>
        {contract.signedByBrand && (
          <p>
            Signed by Brand:{" "}
            {contract.brandSignedAt
              ? new Date(contract.brandSignedAt).toLocaleDateString()
              : "Yes"}
          </p>
        )}
        {contract.signedByCreator && (
          <p>
            Signed by Creator:{" "}
            {contract.creatorSignedAt
              ? new Date(contract.creatorSignedAt).toLocaleDateString()
              : "Yes"}
          </p>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto rounded border border-gray-200 bg-white p-4">
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(contract.content) }}
        />
      </div>

      {contract.status === "SENT" && !contract.signedByCreator && (
        <div className="mt-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            This contract was sent to the creator on{" "}
            {new Date(contract.updatedAt).toLocaleDateString()} at{" "}
            {new Date(contract.updatedAt).toLocaleTimeString()}.
          </p>
          <p className="mt-2">
            Waiting for the creator to review and sign the contract.
          </p>
          <button
            onClick={sendToCreator}
            disabled={sending}
            className="mt-3 inline-flex items-center rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
          >
            {sending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Resending...
              </>
            ) : (
              <>Resend Contract</>
            )}
          </button>
        </div>
      )}

      {contract.status === "SIGNED" && (
        <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            This contract has been signed by both parties and is now in effect.
          </p>
          <p className="mt-2">
            Brand signed:{" "}
            {contract.brandSignedAt
              ? new Date(contract.brandSignedAt).toLocaleDateString()
              : "Yes"}
            <br />
            Creator signed:{" "}
            {contract.creatorSignedAt
              ? new Date(contract.creatorSignedAt).toLocaleDateString()
              : "Yes"}
          </p>
        </div>
      )}
    </div>
  );
}
