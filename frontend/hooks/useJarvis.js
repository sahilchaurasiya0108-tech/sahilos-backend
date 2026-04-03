"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

const WAKE_WORD = "jarvis";
const COMMAND_TIMEOUT = 8000;

export function useJarvis() {
  const [state, setState] = useState("idle"); // idle | listening_for_wake | awake | processing | speaking
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(false);

  const wakeRecognitionRef = useRef(null);
  const commandRecognitionRef = useRef(null);
  const commandTimerRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR && "speechSynthesis" in window);
  }, []);

  const speak = useCallback((text, onDone) => {
    if (!("speechSynthesis" in window)) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05; u.pitch = 0.9; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.toLowerCase().includes("google uk english male") ||
      v.name.toLowerCase().includes("daniel")
    );
    if (preferred) u.voice = preferred;
    u.onend = () => { setState("idle"); onDone?.(); };
    u.onerror = () => { setState("idle"); onDone?.(); };
    setState("speaking");
    window.speechSynthesis.speak(u);
  }, []);

  const processCommand = useCallback(async (text) => {
    if (!text.trim()) { setState("idle"); return; }
    setState("processing");
    setTranscript(text);
    setError(null);
    try {
      const { data } = await api.post("/jarvis", { transcript: text });
      setReply(data.reply);
      speak(data.reply);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong.";
      setError(msg);
      speak(msg);
    }
  }, [speak]);

  const listenForCommand = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    commandRecognitionRef.current?.abort();
    clearTimeout(commandTimerRef.current);
    setState("awake");

    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = false; r.maxAlternatives = 1;
    commandRecognitionRef.current = r;

    r.onresult = (e) => {
      clearTimeout(commandTimerRef.current);
      activeRef.current = false;
      processCommand(e.results[0][0].transcript);
    };
    r.onerror = () => {
      clearTimeout(commandTimerRef.current);
      activeRef.current = false;
      speak("Sorry, I didn't catch that.");
    };
    r.start();

    commandTimerRef.current = setTimeout(() => {
      r.abort(); activeRef.current = false; setState("idle");
    }, COMMAND_TIMEOUT);
  }, [processCommand, speak]);

  // Single-shot sessions with a rest gap — much lower CPU than continuous mode
  const startWakeListener = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !activeRef.current) return;
    wakeRecognitionRef.current?.abort();

    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = false; r.maxAlternatives = 3;
    wakeRecognitionRef.current = r;

    r.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) {
        for (let j = 0; j < e.results[i].length; j++) {
          if (e.results[i][j].transcript.toLowerCase().includes(WAKE_WORD)) {
            r.abort();
            listenForCommand();
            return;
          }
        }
      }
      if (activeRef.current) setTimeout(() => startWakeListener(), 300);
    };
    r.onerror = (e) => {
      if (e.error !== "aborted" && activeRef.current)
        setTimeout(() => startWakeListener(), 800);
    };
    r.onend = () => {
      if (activeRef.current) setTimeout(() => startWakeListener(), 300);
    };

    setState("listening_for_wake");
    try { r.start(); } catch (_) {}
  }, [listenForCommand]);

  const activate = useCallback(() => {
    if (!supported) return;
    activeRef.current = true;
    startWakeListener();
  }, [supported, startWakeListener]);

  const deactivate = useCallback(() => {
    activeRef.current = false;
    setState("idle");
    setTranscript(""); setReply("");
    wakeRecognitionRef.current?.abort();
    commandRecognitionRef.current?.abort();
    clearTimeout(commandTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const tapToTalk = useCallback(() => {
    if (!supported) return;
    activeRef.current = true;
    wakeRecognitionRef.current?.abort();
    listenForCommand();
  }, [supported, listenForCommand]);

  useEffect(() => () => deactivate(), [deactivate]);

  return { state, transcript, reply, error, supported, activate, deactivate, tapToTalk, isActive: state !== "idle" };
}