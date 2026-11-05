import type { DemoThread } from "./demo-data.ts";
// Local prototype state only. Never infer another student's read receipt.
export function sortThreads(threads: DemoThread[]) {
  const timestamp = (t: DemoThread) =>
    Number.isFinite(Date.parse(t.updatedAt ?? ""))
      ? Date.parse(t.updatedAt!)
      : 0;
  return [...threads].sort((a, b) => timestamp(b) - timestamp(a));
}
export function markThreadRead(threads: DemoThread[], id: string, at: string) {
  return threads.map((t) =>
    t.id === id ? { ...t, unread: false, lastReadAt: at } : t,
  );
}
export function addLocalMessage(
  threads: DemoThread[],
  id: string,
  text: string,
  at: string,
  time: string,
) {
  const thread = threads.find((t) => t.id === id);
  if (!thread) throw new Error("Choose a conversation first.");
  if (!text.trim() || text.trim().length > 1000)
    throw new Error("Write a message of up to 1,000 characters.");
  const updated: DemoThread = {
    ...thread,
    unread: false,
    updatedAt: at,
    messages: [...thread.messages, { from: "me", text: text.trim(), time }],
  };
  return [updated, ...sortThreads(threads.filter((t) => t.id !== id))];
}
