"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadSavedIds, setSaved } from "@/lib/saved/service";
import { message } from "@/lib/listings/model";

export const SAVED_UPDATED = "husky-saved-update";
export function useSaved(ids: string[]) {
  const query = ids.join(",");
  const [state, setState] = useState({
    query: "",
    userId: "",
    ids: [] as string[],
  });
  const [busy, setBusy] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const locks = useRef(new Set<string>());
  const version = useRef(0);
  useEffect(() => {
    if (!query) return;
    let active = true;
    const request = ++version.current;
    const client = createClient();
    loadSavedIds(client, query.split(","))
      .then((data) => {
        if (active && version.current === request) {
          setState({ query, ...data });
          setError("");
        }
      })
      .catch((e) => {
        if (active && version.current === request) {
          setState({ query: "", userId: "", ids: [] });
          setError(message(e));
        }
      });
    function refresh() {
      version.current++;
      setRetry((value) => value + 1);
    }
    function update(event: Event) {
      const data = (
        event as CustomEvent<{ userId: string; id: string; saved: boolean }>
      ).detail;
      setState((previous) => {
        if (previous.userId !== data.userId) return previous;
        return {
          ...previous,
          ids: data.saved
            ? [...new Set([...previous.ids, data.id])]
            : previous.ids.filter((id) => id !== data.id),
        };
      });
      refresh();
    }
    const { data: subscription } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setState({ query: "", userId: "", ids: [] });
        refresh();
      }
    });
    window.addEventListener(SAVED_UPDATED, update);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      window.removeEventListener(SAVED_UPDATED, update);
      window.removeEventListener("focus", refresh);
    };
  }, [query, retry]);
  async function toggle(id: string) {
    if (state.query !== query || !state.userId || locks.current.has(id)) return;
    locks.current.add(id);
    const attempt = ++version.current;
    setBusy((previous) => [...previous, id]);
    setError("");
    const saved = !state.ids.includes(id);
    try {
      await setSaved(createClient(), id, state.userId, saved);
      window.dispatchEvent(
        new CustomEvent(SAVED_UPDATED, {
          detail: { userId: state.userId, id, saved },
        }),
      );
    } catch (e) {
      if (version.current === attempt) setError(message(e));
    } finally {
      locks.current.delete(id);
      setBusy((previous) => previous.filter((value) => value !== id));
    }
  }
  return {
    ids: state.query === query ? state.ids : [],
    ready: state.query === query && Boolean(state.userId),
    busy,
    error: query ? error : "",
    toggle,
    retry: () => {
      version.current++;
      setRetry((value) => value + 1);
    },
  };
}
export type SavedControls = ReturnType<typeof useSaved>;
