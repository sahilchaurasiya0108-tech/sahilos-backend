"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Fires a custom event so useDashboard (on dashboard page) silently refetches
const invalidateDashboard = () =>
  window.dispatchEvent(new Event("dashboard:invalidate"));

// ── useProjects ───────────────────────────────────────────────────────────────
export function useProjects(params = {}) {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const buildQuery = () => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return q.toString();
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects?${buildQuery()}`);
      setProjects(res.data.data);
      setPagination(res.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = useCallback(async (payload) => {
    const res = await api.post("/projects", payload);
    setProjects((prev) => [res.data.data, ...prev]);
    toast.success("Project created");
    return res.data.data;
  }, []);

  const updateProject = useCallback(async (id, payload) => {
    const res = await api.put(`/projects/${id}`, payload);
    setProjects((prev) => prev.map((p) => (p._id === id ? res.data.data : p)));
    toast.success("Project updated");
    return res.data.data;
  }, []);

  const toggleMilestone = useCallback(async (projectId, milestoneId) => {
    const res = await api.patch(`/projects/${projectId}/milestones/${milestoneId}`);
    setProjects((prev) => prev.map((p) => (p._id === projectId ? res.data.data : p)));
    return res.data.data;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await api.delete(`/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p._id !== id));
    toast.success("Project deleted");
  }, []);

  return {
    projects, pagination, loading, error,
    fetchProjects, createProject, updateProject, toggleMilestone, deleteProject,
  };
}

// ── useHabits ─────────────────────────────────────────────────────────────────
export function useHabits() {
  const [habits, setHabits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Always send client's local date so backend uses IST not UTC
  const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/habits?localDate=${localDate}`);
      setHabits(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }, [localDate]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const createHabit = useCallback(async (payload) => {
    const res = await api.post("/habits", payload);
    setHabits((prev) => [res.data.data, ...prev]);
    toast.success("Habit created");
    return res.data.data;
  }, []);

  const updateHabit = useCallback(async (id, payload) => {
    const res = await api.put(`/habits/${id}`, payload);
    setHabits((prev) => prev.map((h) => (h._id === id ? res.data.data : h)));
    toast.success("Habit updated");
    return res.data.data;
  }, []);

  const logToday = useCallback(async (id) => {
    const res = await api.post(`/habits/${id}/log`, { localDate });
    await fetchHabits();
    invalidateDashboard(); // tell dashboard to refresh
    return res.data.data;
  }, [fetchHabits, localDate]);

  const unlogToday = useCallback(async (id) => {
    await api.delete(`/habits/${id}/log`, { data: { localDate } });
    await fetchHabits();
    invalidateDashboard(); // tell dashboard to refresh
  }, [fetchHabits, localDate]);

  const deleteHabit = useCallback(async (id) => {
    await api.delete(`/habits/${id}`);
    setHabits((prev) => prev.filter((h) => h._id !== id));
    toast.success("Habit deleted");
  }, []);

  return {
    habits, loading, error,
    fetchHabits, createHabit, updateHabit, logToday, unlogToday, deleteHabit,
  };
}

// ── useJobs ───────────────────────────────────────────────────────────────────
export function useJobs(params = {}) {
  const [jobs, setJobs]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
      const res = await api.get(`/jobs?${q.toString()}`);
      setJobs(res.data.data);
      setPagination(res.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const createJob = useCallback(async (payload) => {
    const res = await api.post("/jobs", payload);
    setJobs((prev) => [res.data.data, ...prev]);
    toast.success("Job added to pipeline");
    return res.data.data;
  }, []);

  const updateJob = useCallback(async (id, payload) => {
    const res = await api.put(`/jobs/${id}`, payload);
    setJobs((prev) => prev.map((j) => (j._id === id ? res.data.data : j)));
    toast.success("Job updated");
    return res.data.data;
  }, []);

  const patchStage = useCallback(async (id, stage) => {
    const res = await api.patch(`/jobs/${id}/stage`, { stage });
    setJobs((prev) => prev.map((j) => (j._id === id ? res.data.data : j)));
    return res.data.data;
  }, []);

  const deleteJob = useCallback(async (id) => {
    await api.delete(`/jobs/${id}`);
    setJobs((prev) => prev.filter((j) => j._id !== id));
    toast.success("Job removed");
  }, []);

  return {
    jobs, pagination, loading, error,
    fetchJobs, createJob, updateJob, patchStage, deleteJob,
  };
}