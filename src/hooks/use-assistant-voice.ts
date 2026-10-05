import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; abort: () => void; onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((event: { error: string }) => void) | null };
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function useAssistantVoice(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [talk, setTalk] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [interim, setInterim] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const send = useRef(onText);
  const talkRef = useRef(false);
  useEffect(() => { send.current = onText; }, [onText]);
  useEffect(() => {
    const w = window as VoiceWindow;
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    setSpeechSupported("speechSynthesis" in window);
    return () => { talkRef.current = false; recognition.current?.abort(); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  const listen = useCallback(() => {
    const w = window as VoiceWindow;
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) return;
    recognition.current?.abort();
    window.speechSynthesis?.cancel();
    const mic = new Constructor(); recognition.current = mic;
    mic.lang = language; mic.continuous = false; mic.interimResults = true;
    let finalText = "";
    mic.onresult = (event) => {
      finalText = ""; let draft = "";
      for (let i = 0; i < event.results.length; i++) { const r = event.results[i]; if (r.isFinal) finalText += r[0].transcript; else draft += r[0].transcript; }
      setInterim(finalText || draft);
    };
    mic.onerror = (event) => { setVoiceError(event.error === "not-allowed" ? "Microphone permission was denied. You can still type your question." : `Voice input stopped (${event.error}). Try again or type your question.`); talkRef.current = false; setTalk(false); };
    mic.onend = () => { setListening(false); setInterim(""); if (finalText.trim()) send.current(finalText.trim()); else { talkRef.current = false; setTalk(false); } };
    try { mic.start(); setVoiceError(null); setListening(true); } catch { setVoiceError("The microphone could not start. Try again."); }
  }, [language]);
  const stopVoice = useCallback(() => { talkRef.current = false; setTalk(false); const mic = recognition.current; if (mic) { mic.onend = null; mic.abort(); } window.speechSynthesis?.cancel(); setListening(false); setSpeaking(false); setInterim(""); }, []);
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\[EMERGENCY\]|[*#`_]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"));
    utterance.lang = language;
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(language.split("-")[0]));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); if (talkRef.current) listen(); };
    utterance.onerror = () => { setSpeaking(false); talkRef.current = false; setTalk(false); setVoiceError("Read-aloud could not play. Your reply is available as text."); };
    window.speechSynthesis.speak(utterance);
  }, [language, listen]);
  const toggleTalk = () => { if (talkRef.current) stopVoice(); else { talkRef.current = true; setTalk(true); setReadAloud(true); listen(); } };
  return { supported, speechSupported, listening, speaking, talk, readAloud, setReadAloud, language, setLanguage, interim, voiceError, listen, speak, stopVoice, toggleTalk };
}