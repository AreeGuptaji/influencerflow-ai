"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MessageSender, NegotiationStatus } from "@prisma/client";

interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  contentType: string;
  timestamp: Date;
  emailMetadata?: any;
}

interface Negotiation {
  id: string;
  status: NegotiationStatus;
  aiMode: "AUTONOMOUS" | "ASSISTED";
  messages: Message[];
  creatorEmail: string;
}

export default function NegotiationConversation({
  negotiation,
  campaignId,
}: {
  negotiation: Negotiation;
  campaignId: string;
}) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/negotiations/${negotiation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: message,
            sender: "BRAND_MANUAL",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessage("");
      router.refresh();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAIMode = async () => {
    try {
      const newMode =
        negotiation.aiMode === "AUTONOMOUS" ? "ASSISTED" : "AUTONOMOUS";
      const response = await fetch(
        `/api/campaigns/${campaignId}/negotiations/${negotiation.id}/mode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: newMode,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to change AI mode");
      }

      router.refresh();
    } catch (error) {
      console.error("Error changing AI mode:", error);
      alert("Failed to change AI mode. Please try again.");
    }
  };

  // Format the messages for display
  const formatMessageContent = (message: Message) => {
    // Handle email content with HTML if needed
    if (message.contentType === "EMAIL_HTML") {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />;
    }
    // Simple text formatting with line breaks
    return (
      <div>
        {message.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-[700px] flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold">Conversation</h2>
          <p className="text-sm text-gray-500">
            {negotiation.messages.length} messages
          </p>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-sm">AI Mode:</span>
          <button
            onClick={handleToggleAIMode}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              negotiation.aiMode === "AUTONOMOUS"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {negotiation.aiMode}
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {negotiation.messages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No messages yet.</p>
            <p className="mt-2 text-sm">
              {negotiation.status === "PENDING_OUTREACH"
                ? "Send the first message to start the negotiation."
                : "Waiting for responses..."}
            </p>
          </div>
        ) : (
          negotiation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "CREATOR" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.sender === "CREATOR"
                    ? "bg-gray-100"
                    : msg.sender === "BRAND_AI"
                      ? "bg-blue-100"
                      : "bg-green-100"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-sm font-medium">
                    {msg.sender === "CREATOR"
                      ? negotiation.creatorEmail.split("@")[0]
                      : msg.sender === "BRAND_AI"
                        ? "AI Assistant"
                        : "You"}
                  </span>
                  <span className="ml-4 text-xs text-gray-500">
                    {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                  </span>
                </div>
                <div className="text-sm">{formatMessageContent(msg)}</div>
                {msg.emailMetadata && msg.emailMetadata.subject && (
                  <div className="mt-2 text-xs text-gray-500">
                    Subject: {msg.emailMetadata.subject}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[80px] flex-1 resize-none rounded-md border border-gray-300 px-3 py-2"
            disabled={
              isSending ||
              negotiation.status === "AGREED" ||
              negotiation.status === "REJECTED" ||
              negotiation.status === "FAILED" ||
              negotiation.status === "DONE" ||
              (negotiation.aiMode === "AUTONOMOUS" &&
                negotiation.status !== "PENDING_OUTREACH")
            }
          />
          <button
            type="submit"
            className="ml-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            disabled={
              !message.trim() ||
              isSending ||
              negotiation.status === "AGREED" ||
              negotiation.status === "REJECTED" ||
              negotiation.status === "FAILED" ||
              negotiation.status === "DONE" ||
              (negotiation.aiMode === "AUTONOMOUS" &&
                negotiation.status !== "PENDING_OUTREACH")
            }
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
        {negotiation.aiMode === "AUTONOMOUS" &&
          negotiation.status !== "PENDING_OUTREACH" && (
            <p className="mt-2 text-xs text-gray-500">
              AI is handling this conversation. Switch to ASSISTED mode to send
              your own messages.
            </p>
          )}
      </div>
    </div>
  );
}
