"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

// ── useIdeas ──────────────────────────────────────────────────────────────────
export function useIdeas(params = {}) {
  const [ideas, setIdeas]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      const res = await api.get(`/ideas?${q.toString()}`);
      setIdeas(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  const createIdea = useCallback(async (payload) => {
    const res = await api.post("/ideas", payload);
    setIdeas((prev) => [res.data.data, ...prev]);
    toast.success("Idea saved!");
    return res.data.data;
  }, []);

  const updateIdea = useCallback(async (id, payload) => {
    const res = await api.put(`/ideas/${id}`, payload);
    setIdeas((prev) => prev.map((i) => (i._id === id ? res.data.data : i)));
    toast.success("Idea updated");
    return res.data.data;
  }, []);

  const convertToProject = useCallback(async (id) => {
    const res = await api.post(`/ideas/${id}/convert`);
    setIdeas((prev) =>
      prev.map((i) => (i._id === id ? res.data.data.idea : i))
    );
    toast.success("Idea converted to project! 🚀");
    return res.data.data;
  }, []);

  const deleteIdea = useCallback(async (id) => {
    await api.delete(`/ideas/${id}`);
    setIdeas((prev) => prev.filter((i) => i._id !== id));
    toast.success("Idea deleted");
  }, []);

  return { ideas, pagination, loading, fetchIdeas, createIdea, updateIdea, convertToProject, deleteIdea };
}

// ── useLearning ───────────────────────────────────────────────────────────────
export function useLearning(params = {}) {
  const [items, setItems]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      const res = await api.get(`/learning?${q.toString()}`);
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createItem = useCallback(async (payload) => {
    const res = await api.post("/learning", payload);
    setItems((prev) => [res.data.data, ...prev]);
    toast.success("Learning item added");
    return res.data.data;
  }, []);

  const updateItem = useCallback(async (id, payload) => {
    const res = await api.put(`/learning/${id}`, payload);
    setItems((prev) => prev.map((i) => (i._id === id ? res.data.data : i)));
    toast.success("Updated");
    return res.data.data;
  }, []);

  const patchProgress = useCallback(async (id, progress) => {
    const res = await api.patch(`/learning/${id}/progress`, { progress });
    setItems((prev) => prev.map((i) => (i._id === id ? res.data.data : i)));
    return res.data.data;
  }, []);

  const deleteItem = useCallback(async (id) => {
    await api.delete(`/learning/${id}`);
    setItems((prev) => prev.filter((i) => i._id !== id));
    toast.success("Item deleted");
  }, []);

  return { items, pagination, loading, fetchItems, createItem, updateItem, patchProgress, deleteItem };
}

// ── useJournal ────────────────────────────────────────────────────────────────
export function useJournal(params = {}) {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      const res = await api.get(`/journal?${q.toString()}`);
      setEntries(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const upsertEntry = useCallback(async (payload) => {
    const res = await api.post("/journal", payload);
    setEntries((prev) => {
      const exists = prev.find((e) => e.date === payload.date);
      if (exists) return prev.map((e) => (e.date === payload.date ? res.data.data : e));
      return [res.data.data, ...prev];
    });
    return res.data.data;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    await api.delete(`/journal/${id}`);
    setEntries((prev) => prev.filter((e) => e._id !== id));
    toast.success("Entry deleted");
  }, []);

  return { entries, pagination, loading, fetchEntries, upsertEntry, deleteEntry };
}
