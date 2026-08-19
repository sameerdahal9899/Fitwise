import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { ChevronLeftIcon, MessageIcon, SendIcon } from "../../components/ui/Icons";
import { Avatar, Badge, PageLoading } from "../../components/ui/Primitives";
import { usePolling } from "../../hooks/usePolling";
import { getErrorMessage } from "../../services/api";
import { getMessages, listConversations, sendMessage } from "../../services/messages";
import { formatRelativeTime, formatDateTime } from "../../utils/formatters";

function ConversationList({ conversations, activeId }) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageIcon size={24} />}
        title="No conversations yet"
        description="Messaging opens automatically once you and a coach are connected."
      />
    );
  }
  return (
    <div className="divide-y divide-edge">
      {conversations.map((c) => (
        <Link
          key={c.id}
          to={`/app/messages/${c.id}`}
          className={["flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2", String(c.id) === String(activeId) ? "bg-surface-2" : ""].join(" ")}
        >
          <Avatar name={c.other_participant_name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink truncate">{c.other_participant_name}</p>
              {c.last_message && <span className="text-[11px] text-ink-faint shrink-0">{formatRelativeTime(c.last_message.created_at)}</span>}
            </div>
            <p className="text-xs text-ink-soft truncate mt-0.5">{c.last_message?.content || "Say hello!"}</p>
          </div>
          {c.unread_count > 0 && <Badge tone="primary">{c.unread_count}</Badge>}
        </Link>
      ))}
    </div>
  );
}

function ConversationThread({ conversationId, meta, onSent }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const isConnectionActive = meta?.connection_status === "accepted";

  async function load() {
    try {
      const data = await getMessages(conversationId);
      setMessages(data.results);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "This conversation is no longer available."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  usePolling(load, 4000, !!conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversationId, draft.trim());
      setDraft("");
      await load();
      onSent?.();
    } catch (err) {
      setError(getErrorMessage(err, "Could not send that message."));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {error && <Alert tone="danger">{error}</Alert>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
            <div
              className={[
                "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.is_mine ? "bg-primary text-white rounded-br-sm" : "bg-surface-2 border border-edge text-ink rounded-bl-sm",
              ].join(" ")}
              title={formatDateTime(m.created_at)}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-edge">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!isConnectionActive}
          placeholder={isConnectionActive ? "Write a message…" : "This connection is no longer active"}
          aria-label="Message"
          className="flex-1 h-11 rounded-xl border border-edge bg-surface-2 px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <Button type="submit" size="md" disabled={!isConnectionActive || !draft.trim()} loading={sending} aria-label="Send message">
          <SendIcon size={17} />
        </Button>
      </form>
    </div>
  );
}

export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
  const [error, setError] = useState("");

  async function loadConversations() {
    try {
      const results = await listConversations();
      setConversations(results);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  usePolling(loadConversations, 8000, true);

  const active = conversations?.find((c) => String(c.id) === String(id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">Messages</h1>
      </div>

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      {conversations === null ? (
        <PageLoading />
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="grid sm:grid-cols-[280px_1fr] h-[calc(100vh-220px)] min-h-[420px]">
            <div className={["overflow-y-auto border-edge sm:border-r", id ? "hidden sm:block" : "block"].join(" ")}>
              <ConversationList conversations={conversations} activeId={id} />
            </div>
            <div className={["flex flex-col", id ? "flex" : "hidden sm:flex"].join(" ")}>
              {id ? (
                <>
                  <div className="sm:hidden flex items-center gap-2 px-4 py-3 border-b border-edge">
                    <button onClick={() => navigate("/app/messages")} aria-label="Back to conversations" className="p-1 text-ink-soft">
                      <ChevronLeftIcon size={18} />
                    </button>
                    <span className="text-sm font-medium text-ink">{active?.other_participant_name}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-3 border-b border-edge">
                    <Avatar name={active?.other_participant_name} size="sm" />
                    <span className="text-sm font-medium text-ink">{active?.other_participant_name}</span>
                  </div>
                  <ConversationThread conversationId={id} meta={active} onSent={loadConversations} />
                </>
              ) : (
                <EmptyState
                  icon={<MessageIcon size={24} />}
                  title="Select a conversation"
                  description="Choose someone from the list to see your message history."
                  className="h-full flex flex-col items-center justify-center"
                />
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
