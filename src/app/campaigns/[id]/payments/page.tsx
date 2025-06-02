"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { PaymentStatus, PaymentType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

// Simple toast component
function Toast({
  message,
  type = "error",
  onDismiss,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed right-4 bottom-4 z-50 rounded-md p-4 shadow-md ${
        type === "error"
          ? "bg-red-500 text-white"
          : type === "success"
            ? "bg-green-500 text-white"
            : "bg-blue-500 text-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p>{message}</p>
        <button
          onClick={onDismiss}
          className="bg-opacity-20 ml-4 rounded-full bg-white p-1 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Define type for deliverables
interface Deliverable {
  id: string;
  name: string;
  description: string;
  amount: number;
  completed: boolean;
  paid: boolean;
  completedAt?: string | null;
  paidAt?: string | null;
}

export default function CampaignPaymentsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const needsFunding = searchParams.get("needsFunding") === "true";

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [processingDeliverableIds, setProcessingDeliverableIds] = useState<
    string[]
  >([]);
  const [isAddingFunds, setIsAddingFunds] = useState(needsFunding);
  const [fundAmount, setFundAmount] = useState<number>(0);

  // Show funding toast if redirected from campaign launch
  useEffect(() => {
    if (needsFunding) {
      showToast(
        "Your campaign needs funding before it can be launched. Please add funds.",
        "info",
      );
    }
  }, [needsFunding]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Get campaign data
  const campaignQuery = api.campaign.getById.useQuery({ id: params.id });

  // Get payments for this campaign
  const paymentsQuery = api.payment.getCampaignPayments.useQuery(
    { campaignId: params.id },
    { enabled: !!params.id },
  );

  // Get contracts for this campaign
  const contractsQuery = api.payment.getCampaignContracts.useQuery(
    { campaignId: params.id },
    { enabled: !!params.id },
  );

  // Process payment mutation
  const processPayment = api.payment.processPayment.useMutation({
    onSuccess: () => {
      showToast(
        "Deliverables marked as completed and payment processed",
        "success",
      );
      setProcessingDeliverableIds([]);
      void paymentsQuery.refetch();
      void contractsQuery.refetch();
    },
    onError: (error) => {
      setProcessingDeliverableIds([]);
      showToast(error.message || "Failed to process payment", "error");
    },
  });

  // Initiate payment mutation
  const initiatePayment = api.payment.initiatePayment.useMutation({
    onSuccess: (data) => {
      // Redirect to the Stripe checkout page
      if (data?.url) {
        window.location.href = data.url;
      } else {
        showToast("Payment initiated, but no checkout URL returned", "error");
      }
      setIsAddingFunds(false);
    },
    onError: (error) => {
      showToast(error.message || "Failed to initiate payment", "error");
      setIsAddingFunds(false);
    },
  });

  // Handle adding funds to campaign
  const handleAddFunds = () => {
    if (!fundAmount || fundAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    // Convert dollar amount to cents for Stripe
    const amountInCents = Math.round(fundAmount * 100);

    initiatePayment.mutate({
      campaignId: params.id,
      amount: amountInCents,
      description: `Funding for campaign: ${campaignQuery.data?.title || ""}`,
      returnUrl: window.location.href,
    });
  };

  // Handle marking deliverables as completed and processing payment
  const handleMarkCompleted = (
    contractId: string,
    deliverableIds: string[],
  ) => {
    setProcessingDeliverableIds(deliverableIds);
    processPayment.mutate({
      campaignId: params.id,
      contractId,
      deliverableIds,
    });
  };

  // Loading state
  const isLoading =
    campaignQuery.isLoading ||
    paymentsQuery.isLoading ||
    contractsQuery.isLoading;
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Error state
  if (campaignQuery.error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-600">Error</h2>
          <p className="text-red-700">{campaignQuery.error.message}</p>
          <Link
            href={`/campaigns/${params.id}`}
            className="mt-4 inline-block rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
          >
            Back to Campaign
          </Link>
        </div>
      </div>
    );
  }

  const campaign = campaignQuery.data;
  if (!campaign) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Campaign not found</div>
        <Link
          href="/campaigns"
          className="ml-4 rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Back to Campaigns
        </Link>
      </div>
    );
  }

  // Safely handle data
  const payments = paymentsQuery.data ?? [];
  const contracts = contractsQuery.data ?? [];

  // Calculate total payments
  const totalAllocated = payments.reduce(
    (acc, payment) => acc + payment.amount,
    0,
  );
  const remainingBudget = campaign.budget - totalAllocated;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{campaign.title} - Payments</h1>

      {needsFunding && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-yellow-800">
            Campaign Funding Required
          </h2>
          <p className="text-yellow-700">
            Your campaign needs to be funded before it can be launched. Please
            add funds below to proceed with launching your campaign.
          </p>
        </div>
      )}

      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Campaign Budget</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total Budget</p>
            <p className="text-2xl font-bold">${campaign.budget / 100}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Allocated</p>
            <p className="text-2xl font-bold">${totalAllocated / 100}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-2xl font-bold">${remainingBudget / 100}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setIsAddingFunds(!isAddingFunds)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Funds
          </button>
        </div>

        {isAddingFunds && (
          <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-lg font-medium">Add Funds to Campaign</h3>
            <div className="flex items-center">
              <div className="mr-2 flex-shrink-0">$</div>
              <input
                type="number"
                value={fundAmount || ""}
                onChange={(e) => setFundAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleAddFunds}
                disabled={initiatePayment.isPending}
                className="ml-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {initiatePayment.isPending ? "Processing..." : "Confirm"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Funds will be used to pay creators as they complete deliverables.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Payment History</h2>
        {payments.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                          payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${payment.amount / 100}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.creatorId !== "placeholder"
                        ? payment.creatorId
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.completedAt
                        ? new Date(payment.completedAt).toLocaleDateString()
                        : new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No payments have been made yet</p>
            <p className="mt-4 text-sm text-gray-500">
              To get started, add initial funds to your campaign
            </p>
            <button
              onClick={() => setIsAddingFunds(true)}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Funds
            </button>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Deliverables</h2>
        {contracts.length > 0 ? (
          <div className="space-y-6">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <div className="border-b bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-medium">
                    Contract with Creator:{" "}
                    {contract.creatorName ?? contract.creatorId}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    {contract.signedByBrand && contract.signedByCreator
                      ? "Signed by both parties"
                      : contract.signedByBrand
                        ? "Signed by brand only"
                        : contract.signedByCreator
                          ? "Signed by creator only"
                          : "Not signed"}
                  </p>
                </div>
                {contract.deliverables && contract.deliverables.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Deliverable
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {contract.deliverables.map(
                          (deliverable: Deliverable) => (
                            <tr key={deliverable.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {deliverable.name}
                              </td>
                              <td className="px-6 py-4">
                                {deliverable.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                ${deliverable.amount / 100}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {deliverable.paid ? (
                                  <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                    Paid
                                  </span>
                                ) : deliverable.completed ? (
                                  <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs leading-5 font-semibold text-blue-800">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs leading-5 font-semibold text-yellow-800">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {!deliverable.completed &&
                                  !deliverable.paid && (
                                    <button
                                      onClick={() =>
                                        handleMarkCompleted(contract.id, [
                                          deliverable.id,
                                        ])
                                      }
                                      disabled={processingDeliverableIds.includes(
                                        deliverable.id,
                                      )}
                                      className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                                    >
                                      {processingDeliverableIds.includes(
                                        deliverable.id,
                                      )
                                        ? "Processing..."
                                        : "Mark Completed"}
                                    </button>
                                  )}
                                {deliverable.completed && !deliverable.paid && (
                                  <button
                                    onClick={() =>
                                      handleMarkCompleted(contract.id, [
                                        deliverable.id,
                                      ])
                                    }
                                    disabled={processingDeliverableIds.includes(
                                      deliverable.id,
                                    )}
                                    className="rounded bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                                  >
                                    {processingDeliverableIds.includes(
                                      deliverable.id,
                                    )
                                      ? "Processing..."
                                      : "Pay Now"}
                                  </button>
                                )}
                                {deliverable.paid && (
                                  <span className="text-sm text-gray-500">
                                    Paid on{" "}
                                    {deliverable.paidAt
                                      ? new Date(
                                          deliverable.paidAt,
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No deliverables found</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-500">
              No contracts found for this campaign
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href={`/campaigns/${params.id}`}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Back to Campaign
        </Link>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
