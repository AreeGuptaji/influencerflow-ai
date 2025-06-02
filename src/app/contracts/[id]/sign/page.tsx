"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Check, X } from "lucide-react";
import Link from "next/link";

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
  campaign: {
    id: string;
    title: string;
  };
}

export default function ContractSignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const router = useRouter();

  // Resolve params when component mounts
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params;
        setContractId(resolvedParams.id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to resolve params",
        );
      }
    }

    void resolveParams();
  }, [params]);

  // Fetch contract data
  const fetchContract = async () => {
    if (!contractId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/public`);

      if (!response.ok) {
        throw new Error(`Error fetching contract: ${response.statusText}`);
      }

      const data = await response.json();
      // Type check the response
      if (data && typeof data === "object" && "contract" in data) {
        setContract(data.contract as ContractData);

        // Check if already signed
        if (data.contract && data.contract.signedByCreator) {
          setSigned(true);
        }
      } else {
        throw new Error("Invalid contract data received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contract");
    } finally {
      setLoading(false);
    }
  };

  // Sign the contract
  const signContract = async () => {
    if (!contract || !contractId || !creatorName || !creatorEmail) return;

    setSigning(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorName,
          creatorEmail,
          bankDetails: {
            accountNumber,
            ifscCode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error signing contract: ${response.statusText}`);
      }

      setSigned(true);
      await fetchContract();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  // Fetch contract when contractId changes
  useEffect(() => {
    if (contractId) {
      void fetchContract();
    }
  }, [contractId]);

  // Render markdown content as HTML
  const renderMarkdown = (content: string): string => {
    // Very simple markdown rendering (a more robust solution would use a markdown library)
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold my-3">$1</h2>')
      .replace(/\n\n/g, '<div class="my-2"></div>')
      .replace(/\n/g, "<br />");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-md">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-md">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchContract}
              className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-md">
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h2 className="mb-2 text-xl font-bold">Contract Not Found</h2>
            <p className="text-gray-600">
              The contract you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (signed || contract.signedByCreator) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 py-12">
        <div className="mx-auto w-full max-w-4xl rounded-lg bg-white p-8 shadow-md">
          <div className="mb-8 flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="mb-4 text-center text-2xl font-bold">
            Contract Signed Successfully!
          </h1>
          <p className="mb-6 text-center text-gray-600">
            Thank you for signing the contract for the campaign:{" "}
            <strong>{contract.campaign.title}</strong>
          </p>
          <div className="mb-8 rounded-lg bg-gray-50 p-4">
            <h2 className="mb-2 text-lg font-semibold">Contract Details:</h2>
            <p>
              <strong>Contract ID:</strong> {contract.id}
              <br />
              <strong>Version:</strong> {contract.version}
              <br />
              <strong>Signed Date:</strong>{" "}
              {contract.creatorSignedAt
                ? new Date(contract.creatorSignedAt).toLocaleString()
                : new Date().toLocaleString()}
            </p>
          </div>
          {(accountNumber || ifscCode) && (
            <div className="mb-8 rounded-lg bg-blue-50 p-4">
              <h2 className="mb-2 text-lg font-semibold text-blue-700">
                Payment Details Provided:
              </h2>
              <p className="text-blue-700">
                {accountNumber && (
                  <>
                    <strong>Account Number:</strong> {accountNumber}
                    <br />
                  </>
                )}
                {ifscCode && (
                  <>
                    <strong>IFSC Code:</strong> {ifscCode}
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-blue-600">
                These details will be used for payment processing after campaign
                completion.
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                window.location.href = `/api/contracts/${contract.id}/pdf`;
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Download Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 py-12">
      <div className="mx-auto w-full max-w-4xl rounded-lg bg-white p-8 shadow-md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Review & Sign Contract</h1>
          <p className="text-gray-600">
            For campaign: <strong>{contract.campaign.title}</strong>
          </p>
        </div>

        <div className="mb-8 max-h-[500px] overflow-y-auto rounded border border-gray-200 bg-white p-6">
          <div
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(contract.content),
            }}
          />
        </div>

        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Sign Contract</h2>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Your Full Name
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Your Email Address
              </label>
              <input
                type="email"
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-md mb-2 font-medium text-gray-700">
              Payment Details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Account Number"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                  placeholder="IFSC Code"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Bank details are required for payment processing after the
              campaign is completed.
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700">
                I have read and agree to the terms of this contract
              </span>
            </label>
          </div>

          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-4">
            <button
              onClick={signContract}
              disabled={!creatorName || !creatorEmail || signing}
              className="rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signing ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing...
                </span>
              ) : (
                "Sign Contract"
              )}
            </button>

            <button
              onClick={() => window.history.back()}
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
