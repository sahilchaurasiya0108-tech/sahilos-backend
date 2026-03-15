"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useBudget(params = {}) {
  const [entries, setEntries]   = useState([]);
  const [summary, setSummary]   = useState({ income: 0, expense: 0, balance: 0, categoryBreakdown: [] });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]   = useState(true);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return q.toString();
  }, [JSON.stringify(params)]);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const [entriesRes, summaryRes] = await Promise.all([
        api.get(`/budget?${buildQuery()}`),
        api.get(`/budget/summary?${buildQuery()}`),
      ]);
      setEntries(entriesRes.data.data);
      setPagination(entriesRes.data.pagination);
      setSummary(summaryRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const createEntry = useCallback(async (payload) => {
    const res = await api.post("/budget", payload);
    await fetchEntries(); // refetch to update summary too
    toast.success(`${payload.type === "income" ? "Income" : "Expense"} added`);
    return res.data.data;
  }, [fetchEntries]);

  const updateEntry = useCallback(async (id, payload) => {
    const res = await api.put(`/budget/${id}`, payload);
    await fetchEntries();
    toast.success("Entry updated");
    return res.data.data;
  }, [fetchEntries]);

  const deleteEntry = useCallback(async (id) => {
    await api.delete(`/budget/${id}`);
    await fetchEntries();
    toast.success("Entry deleted");
  }, [fetchEntries]);

  return {
    entries, summary, pagination, loading,
    fetchEntries, createEntry, updateEntry, deleteEntry,
  };
}
