import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Volume2, VolumeX, Square, Trash2, AudioLines, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useAnalysis } from "@/context/analysis-context";
import { useAssistantVoice } from "@/hooks/use-assistant-voice";
import heart from "@/assets/cardioneuro-heart.jpg";

export const EMERGENCY_NOTICE = "If you are experiencing severe chest pain, severe shortness of breath, fainting, or other potentially serious symptoms, seek emergency medical care immediately.";
const redFlags = /chest (pain|tightness)|can'?t breathe|severe (shortness|breath)|faint|passed out|slurred speech|stroke|heart attack/i;
const starters = ["I have chest tightness when I climb stairs", "What does high blood pressure feel like?", "Explain my risk result", "Is my heart rate normal?", "Foods that help my heart"];
const symptoms = ["Chest pain", "Breathlessness", "Dizziness", "Palpitations", "Swelling in legs", "Fatigue", "Nausea", "Sweating"];

export function SymptomAssistant() {
  const { result } = useAnalysis();
  const context = useRef<unknown>({ note: "No dataset analyzed yet" });
  context.current = result ? { prediction: result.prediction, metrics: result.metrics, heartRate: { ...result.heartRate, series: undefined }, indicators: result.indicators, topFactors: result.topFactors } : { note: "No dataset analyzed yet" };
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: () => ({ context: context.current }) }), []);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => { if (!text.trim() || busy || configured === false) return; clearError(); setInput(""); void sendMessage({ text }); textarea.current?.focus(); };
  const voice = useAssistantVoice(send);
  const lastSpoken = useRef("");
  const focus = () => { if (document.activeElement === document.body || document.activeElement === textarea.current || textarea.current?.closest("form")?.contains(document.activeElement)) textarea.current?.focus({ preventScroll: true }); };
  useEffect(() => { fetch("/api/chat-status").then(r => r.json()).then((d: { configured: boolean }) => setConfigured(d.configured)).catch(() => setConfigured(false)); }, []);
  useEffect(() => { focus(); }, [status]);
  const latest = messages.at(-1);
  const latestText = latest?.parts.filter(p => p.type === "text").map(p => p.text).join("") || "";
  useEffect(() => {
    if (status === "ready" && latest?.role === "assistant" && latestText && latest.id !== lastSpoken.current) {
      lastSpoken.current = latest.id;
      if (voice.readAloud || voice.talk) voice.speak(latestText);
    }
  }, [status, latest?.id, latest?.role, latestText, voice.readAloud, voice.talk, voice.speak]);
  useEffect(() => { if (error) voice.stopVoice(); }, [error, voice.stopVoice]);
  const urgent = messages.some(m => m.role === "user" && redFlags.test(m.parts.filter(p => p.type === "text").map(p => p.text).join("")));
  return (
    <section id="symptom-assistant" className="landing-section scroll-mt-20">
      <p className="eyebrow">A conversation, not a diagnosis</p><h2 className="section-title">Talk to CardioNeuro Assistant</h2><p className="mt-3 text-sm text-muted-foreground">Describe your symptoms or ask a heart-health question. Speak or type.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-card/90">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div className="flex items-center gap-3"><img src={heart} alt="CardioNeuro heart" className="size-10 rounded-md object-cover" /><div><p className="text-sm font-bold">CardioNeuro Assistant</p><p className="mt-1 text-xs text-muted-foreground"><span className={configured ? "text-success" : "text-warning"}>●</span> {configured === null ? "Checking AI" : configured ? "AI configured" : "AI not configured"}</p></div></div><Button variant="ghost" size="icon-sm" aria-label="Clear conversation" title="Clear conversation" onClick={() => { stop(); voice.stopVoice(); setMessages([]); clearError(); textarea.current?.focus(); }}><Trash2 /></Button></div>
          {urgent && <div role="alert" className="border-b border-destructive/40 bg-destructive/15 p-4 text-xs leading-6"><strong className="text-destructive">Call your local emergency number</strong><p>{EMERGENCY_NOTICE}</p></div>}
          <Conversation className="h-[390px]"><ConversationContent className="gap-5 p-5">
            {!messages.length && <div className="py-6"><p className="text-lg font-semibold">What’s on your mind?</p><p className="mt-2 text-sm leading-6 text-muted-foreground">I can discuss heart health and explain your screening results.</p><div className="mt-5 flex flex-wrap gap-2">{starters.map(s => <Button key={s} size="sm" variant="outline" className="h-auto whitespace-normal py-2 text-left" onClick={() => send(s)} disabled={busy || configured === false}>{s}</Button>)}</div></div>}
            {messages.map(m => <Message key={m.id} from={m.role}><MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "w-full"}>{m.parts.map((p, i) => p.type === "text" ? <div key={i}>{p.text.includes("[EMERGENCY]") && <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/15 p-3 text-xs leading-6"><strong>Call your local emergency number</strong><p>{EMERGENCY_NOTICE}</p></div>}<MessageResponse>{p.text.replaceAll("[EMERGENCY]", "")}</MessageResponse></div> : p.type === "reasoning" ? <details key={i} className="text-xs text-muted-foreground"><summary>Thinking</summary><MessageResponse>{p.text}</MessageResponse></details> : null)}</MessageContent>{m.role === "assistant" && voice.speechSupported && <Button variant="ghost" size="icon-sm" aria-label="Read this reply aloud" title="Read this reply aloud" onClick={() => voice.speak(m.parts.filter(p => p.type === "text").map(p => p.text).join(""))}><Volume2 /></Button>}</Message>)}
            {status === "submitted" && <Shimmer>Thinking…</Shimmer>}
          </ConversationContent><ConversationScrollButton aria-label="Scroll to latest message" /></Conversation>
          <div className="border-t border-border p-4">
            {(error || voice.voiceError || configured === false) && <p role="alert" className="mb-3 text-xs leading-5 text-warning">{error?.message || voice.voiceError || "The assistant is not configured. Ask the app owner to enable Lovable AI."}</p>}
            {voice.listening && <p className="mb-2 animate-pulse text-xs text-destructive">Listening… {voice.interim}</p>}
            {voice.speaking && <p className="mb-2 flex items-center gap-2 text-xs text-success"><AudioLines className="size-4 motion-safe:animate-pulse" />Speaking…</p>}
            <PromptInput onSubmit={({ text }) => send(text)}><PromptInputTextarea ref={textarea} autoFocus value={input} onChange={e => setInput(e.target.value)} aria-label="Message CardioNeuro Assistant" placeholder="Ask about your heart health…" className="min-h-24" maxLength={4000} /><PromptInputFooter className="justify-between"><div className="flex items-center gap-1">
              {voice.supported ? <Button type="button" size="icon-sm" variant="ghost" title="Voice input" aria-label="Voice input" disabled={busy} onClick={voice.listening ? voice.stopVoice : voice.listen}><Mic className={voice.listening ? "text-destructive" : ""} /></Button> : <span title="Voice input is unavailable in this browser" className="text-xs text-muted-foreground">Mic unavailable</span>}
              {voice.speechSupported && <Button type="button" size="icon-sm" variant="ghost" title="Read replies aloud" aria-label="Read replies aloud" aria-pressed={voice.readAloud} onClick={() => { voice.setReadAloud(!voice.readAloud); if (voice.readAloud) voice.stopVoice(); }}>{voice.readAloud ? <Volume2 className="text-primary" /> : <VolumeX />}</Button>}
              {(voice.speaking || voice.listening) && <Button type="button" size="icon-sm" variant="ghost" aria-label="Stop voice" title="Stop voice" onClick={voice.stopVoice}><Square /></Button>}
            </div><PromptInputSubmit aria-label={busy ? "Stop response" : "Send message"} status={status} disabled={!busy && (!input.trim() || configured === false)} onStop={() => { stop(); voice.stopVoice(); }} /></PromptInputFooter></PromptInput>
            <div className="mt-3 flex flex-wrap items-center gap-3">{voice.supported && voice.speechSupported && <Button size="sm" variant={voice.talk ? "default" : "secondary"} onClick={voice.toggleTalk} disabled={busy && !voice.talk}><AudioLines />{voice.talk ? "End Talk" : "Talk"}</Button>}<Select value={voice.language} onValueChange={value => { voice.stopVoice(); voice.setLanguage(value); }}><SelectTrigger aria-label="Voice language" className="w-32"><SelectValue /></SelectTrigger><SelectContent>{[["en-US", "English"], ["hi-IN", "Hindi"], ["es-ES", "Spanish"], ["fr-FR", "French"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><span className="text-[10px] text-muted-foreground">Session only · No chat history saved</span></div>
          </div>
        </div>
        <aside className="space-y-6"><div className="border-b border-border pb-6"><h3 className="font-bold">A little context helps</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Share what you’re feeling, when it started and how severe it is. Uploaded results can inform the conversation, but cannot diagnose you.</p></div><SymptomForm onSend={send} disabled={busy || configured === false} /><div className="rounded-lg border border-destructive/40 bg-destructive/10 p-5"><ShieldAlert className="size-6 text-destructive" /><h3 className="mt-3 font-bold">When to call emergency services</h3><p className="mt-3 text-xs leading-6">{EMERGENCY_NOTICE}</p></div><p className="border-l-2 border-warning pl-4 text-xs leading-6 text-warning">The assistant gives general information, not a diagnosis.</p></aside>
      </div>
    </section>
  );
}

function SymptomForm({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  return <details className="border-b border-border pb-6"><summary className="cursor-pointer font-semibold text-sm">Symptom intake</summary><form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); onSend(`My main symptom is ${d.get("symptom")}. It has lasted ${d.get("duration")}. Severity: ${d.get("severity")}/10. Other symptoms: ${d.getAll("symptoms").join(", ") || "none selected"}. What should I consider?`); }}><label className="block text-xs">Main symptom<input required name="symptom" maxLength={500} className="mt-2 w-full rounded-md border border-input bg-surface p-3 text-sm" /></label><label className="block text-xs">How long?<input required name="duration" maxLength={200} className="mt-2 w-full rounded-md border border-input bg-surface p-3 text-sm" /></label><label className="block text-xs">Severity (1–10)<input name="severity" type="number" min={1} max={10} defaultValue={5} required className="ml-3 w-16 rounded-md border border-input bg-surface p-2" /></label><fieldset className="grid grid-cols-2 gap-3"><legend className="mb-3 text-xs text-muted-foreground">Other symptoms</legend>{symptoms.map(s => <label key={s} className="flex items-center gap-2 text-xs"><input type="checkbox" name="symptoms" value={s} className="accent-primary" />{s}</label>)}</fieldset><Button size="sm" disabled={disabled} type="submit">Send to assistant</Button></form></details>;
}