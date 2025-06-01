import { useState } from "react";
import { MessageSender } from "@prisma/client";

interface SendMessageFormProps {
  negotiationId: string;
  campaignId: string;
  onMessageSent?: () => void;
}

export default function SendMessageForm({
  negotiationId,
  campaignId,
  onMessageSent,
}: SendMessageFormProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/negotiations/${negotiationId}/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: "Re: Collaboration opportunity",
            message: message.trim(),
            sender: MessageSender.BRAND_MANUAL,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Clear the message field after successful send
      setMessage("");

      // Notify parent component that a message was sent
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg bg-white p-4 shadow"
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-2">
        <textarea
          className="w-full rounded-md border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Type your message here..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          disabled={isSending || !message.trim()}
        >
          {isSending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
