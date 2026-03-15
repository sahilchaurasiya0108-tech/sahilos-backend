"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useTasks(params = {}) {
  const [tasks, setTasks]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return q.toString();
  }, [JSON.stringify(params)]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks?${buildQuery()}`);
      setTasks(res.data.data);
      setPagination(res.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (payload) => {
    const res = await api.post("/tasks", payload);
    setTasks((prev) => [res.data.data, ...prev]);
    toast.success("Task created");
    return res.data.data;
  }, []);

  const updateTask = useCallback(async (id, payload) => {
    const res = await api.put(`/tasks/${id}`, payload);
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
    toast.success("Task updated");
    return res.data.data;
  }, []);

  const patchStatus = useCallback(async (id, status) => {
    const res = await api.patch(`/tasks/${id}/status`, { status });
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.data : t)));
    return res.data.data;
  }, []);

  const toggleSubtask = useCallback(async (taskId, subtaskId) => {
    const res = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
    return res.data.data;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
    toast.success("Task deleted");
  }, []);

  return {
    tasks, pagination, loading, error,
    fetchTasks, createTask, updateTask, patchStatus, toggleSubtask, deleteTask,
  };
}
