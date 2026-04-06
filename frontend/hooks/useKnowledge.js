"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useKnowledge(params = {}) {
  const [entries, setEntries]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);

  // Single fetch function — mirrors the activity page pattern.
  // `p`      = which page to fetch
  // `append` = true for load-more (append), false for a fresh filter fetch (replace)
  const fetchEntries = useCallback(async (p = 1, append = false, overrideParams) => {
    const activeParams = overrideParams ?? params;
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const q = new URLSearchParams();
      Object.entries(activeParams).forEach(([k, v]) => { if (v) q.set(k, v); });
      q.set("limit", "24");
      q.set("page", String(p));

      const res = await api.get(`/knowledge?${q.toString()}`);
      setEntries((prev) => append ? [...prev, ...res.data.data] : res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  // Reset and refetch from page 1 whenever filters change
  useEffect(() => {
    setPage(1);
    setEntries([]);
    fetchEntries(1, false, params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntries]);

  // Load next page and APPEND — never resets the list
  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchEntries(next, true);
  }, [page, fetchEntries]);

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
    entries, pagination, loading, loadingMore,
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