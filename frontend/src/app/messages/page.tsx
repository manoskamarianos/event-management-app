"use client";

import { use, useState } from "react";
import { api, describeError } from "@/api";
import type { MessageDetail, MessageListItem } from "@/api";
import { useMessages } from "@/context/MessagesContext";
import { useScopedData } from "@/hooks/useScopedData";
import { formatDateTime } from "@/lib/eventHelpers";
import { decodeEntities } from "@/lib/text";
import FormField from "@/components/FormField";
import RequireRole from "@/components/RequireRole";
import TextareaField from "@/components/TextareaField";

type Tab = "inbox" | "sent" | "compose";

interface ComposeTarget {
  receiverId: number;
  eventId: number;
  name: string;
  subject: string;
}

async function fetchLists() {
  const [inbox, outbox] = await Promise.all([api.messages.listInbox(), api.messages.listOutbox()]);
  return { inbox, outbox };
}

function parseTarget(params: { to?: string; event?: string; name?: string }): ComposeTarget | null {
  const receiverId = Number(params.to);
  const eventId = Number(params.event);
  if (!Number.isInteger(receiverId) || !Number.isInteger(eventId) || !params.to || !params.event) {
    return null;
  }
  return { receiverId, eventId, name: params.name ?? `User #${receiverId}`, subject: "" };
}

export default function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; event?: string; name?: string }>;
}) {
  const params = use(searchParams);
  return (
    <RequireRole roles={["organizer", "participant"]}>
      <Messages initialTarget={parseTarget(params)} />
    </RequireRole>
  );
}

function Messages({ initialTarget }: { initialTarget: ComposeTarget | null }) {
  const { refreshUnread } = useMessages();
  const { data: lists, error: loadError, loaded, reload: loadLists } = useScopedData("messages", fetchLists);
  const inbox = lists?.inbox ?? [];
  const outbox = lists?.outbox ?? [];

  const [tab, setTab] = useState<Tab>(initialTarget ? "compose" : "inbox");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, MessageDetail>>({});
  const [target, setTarget] = useState<ComposeTarget | null>(initialTarget);
  const [subject, setSubject] = useState(initialTarget?.subject ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const error = actionError || (loadError ? describeError(loadError, "Could not load your messages.") : "");

  const unread = inbox.filter((message) => !message.read).length;
  const list = tab === "inbox" ? inbox : outbox;

  async function handleToggle(message: MessageListItem) {
    if (expanded === message.id) {
      setExpanded(null);
      return;
    }
    setExpanded(message.id);
    if (details[message.id]) return;
    try {
      // Opening a received message marks it as read on the server.
      const detail = await api.messages.openMessage(message.id);
      setDetails((current) => ({ ...current, [message.id]: detail }));
      if (tab === "inbox" && !message.read) await Promise.all([loadLists(), refreshUnread()]);
    } catch (openError) {
      setActionError(describeError(openError, "Could not open this message."));
    }
  }

  async function handleDelete(message: MessageListItem) {
    setActionError("");
    setNotice("");
    try {
      await api.messages.deleteMessages({ message_ids: [message.id] });
      setExpanded(null);
      await Promise.all([loadLists(), refreshUnread()]);
    } catch (deleteError) {
      setActionError(describeError(deleteError));
    }
  }

  function handleReply(message: MessageListItem) {
    if (message.sender === null || message.event === null) return;
    const original = decodeEntities(message.subject);
    const replySubject = original.startsWith("Re: ") ? original : `Re: ${original}`;
    setTarget({
      receiverId: message.sender,
      eventId: message.event,
      name: message.sender_name,
      subject: replySubject,
    });
    setSubject(replySubject);
    setBody("");
    setNotice("");
    setTab("compose");
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!target) return;
    if (!subject.trim() || !body.trim()) {
      setActionError("Please enter a subject and a message.");
      return;
    }
    setActionError("");
    setSending(true);
    try {
      await api.messages.sendMessage({
        subject: subject.trim(),
        body: body.trim(),
        receiver: target.receiverId,
        event: target.eventId,
      });
      setSubject("");
      setBody("");
      setTarget(null);
      setNotice("Message sent.");
      setTab("sent");
      await loadLists();
    } catch (sendError) {
      setActionError(describeError(sendError));
    } finally {
      setSending(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "inbox", label: unread > 0 ? `Inbox (${unread})` : "Inbox" },
    { id: "sent", label: "Sent" },
    ...(target ? [{ id: "compose" as Tab, label: "New message" }] : []),
  ];

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Messages
        </h1>

        <div className="mt-6 flex gap-2 border-b border-black/[.08] dark:border-white/[.145]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setExpanded(null);
              }}
              className={`px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? "border-b-2 border-foreground text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {notice && <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {tab !== "compose" && (
          <div className="mt-4 divide-y divide-black/[.08] rounded-xl border border-black/[.08] dark:divide-white/[.145] dark:border-white/[.145]">
            {list.map((message) => {
              const detail = details[message.id];
              const canReply = tab === "inbox" && message.sender !== null && message.event !== null;
              return (
                <div key={message.id} className="bg-white p-4 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => handleToggle(message)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {tab === "inbox" && !message.read && (
                        <span className="h-2 w-2 rounded-full bg-red-600" aria-label="Unread" />
                      )}
                      <div>
                        <p className="font-medium text-zinc-950 dark:text-zinc-50">
                          {decodeEntities(message.subject)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {tab === "inbox"
                            ? `From ${message.sender_name || "a deleted user"}`
                            : `To ${message.receiver_name || "a deleted user"}`}
                          {message.event_title && ` · ${message.event_title}`} ·{" "}
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                  {expanded === message.id && (
                    <div className="mt-3 flex items-start justify-between gap-4 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
                      <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                        {detail ? decodeEntities(detail.body) : "Loading…"}
                      </p>
                      <div className="flex shrink-0 gap-4 text-sm font-medium">
                        {canReply && (
                          <button
                            type="button"
                            onClick={() => handleReply(message)}
                            className="text-zinc-950 hover:underline dark:text-zinc-50"
                          >
                            Reply
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(message)}
                          className="text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {loaded && list.length === 0 && (
              <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No messages here.
              </p>
            )}
            {!loaded && (
              <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
            )}
          </div>
        )}

        {tab === "compose" && target && (
          <form
            onSubmit={handleSend}
            className="mt-4 flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              To: <span className="font-medium text-zinc-950 dark:text-zinc-50">{target.name}</span>
            </p>
            <FormField id="subject" label="Subject" value={subject} onChange={setSubject} />
            <TextareaField id="body" label="Message" value={body} onChange={setBody} />
            <button
              type="submit"
              disabled={sending}
              className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
