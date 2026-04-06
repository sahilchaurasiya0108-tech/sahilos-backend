"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useKnowledge(params = {}) {
  // Stable string key — only changes when filters actually change
  const paramsKey = JSON.stringify(params);

  const [entries, setEntries]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  // Keep a ref to the latest paramsKey so loadMore can always read current filters
  const paramsKeyRef = useRef(paramsKey);
  paramsKeyRef.current = paramsKey;

  // Reset to page 1 and refetch when filters change
  useEffect(() => {
    setPage(1);
    setEntries([]);

    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    q.set("limit", "24");
    q.set("page", "1");

    let cancelled = false;
    setLoading(true);
    api.get(`/knowledge?${q.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setEntries(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // loadMore appends the next page — never resets the list
  const loadMore = useCallback(() => {
    setPage((prev) => {
      const next = prev + 1;

      const q = new URLSearchParams();
      Object.entries(JSON.parse(paramsKeyRef.current)).forEach(([k, v]) => { if (v) q.set(k, v); });
      q.set("limit", "24");
      q.set("page", String(next));

      setLoading(true);
      api.get(`/knowledge?${q.toString()}`)
        .then((res) => {
          setEntries((e) => [...e, ...res.data.data]);
          setPagination(res.data.pagination);
        })
        .finally(() => setLoading(false));

      return next;
    });
  }, []);

  const createEntry = useCallback(async (payload) => {
    const res = await api.post("/knowledge", payload);
    setEntries((prev) => [res.data.data, ...prev]);
    toast.success("Entry saved to Knowledge Vault");
    return res.data.data;
  }, []);

  const updateEntry = useCallback(async (id, payload) => {
    const res = await api.put(`/knowledge/${id}`, payload);
    setEntries((prev) => prev.map((e) => (e._id === id ? res.data.data : e)));
    toast.success("Entry updated");
    return res.data.data;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    await api.delete(`/knowledge/${id}`);
    setEntries((prev) => prev.filter((e) => e._id !== id));
    toast.success("Entry deleted");
  }, []);

  return {
    entries, pagination, loading,
    loadMore, createEntry, updateEntry, deleteEntry,
    hasMore: pagination?.hasNext ?? false,
  };
}

export function useKnowledgeCounts() {
  const [counts, setCounts]   = useState({});
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/knowledge/counts");
      setCounts(res.data.data.counts);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { counts, total, loading, refetch: fetch };
}