import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AudioLines, Check, ImagePlus, LoaderCircle, Mic2, Play, RotateCcw, Sparkles, UploadCloud, WandSparkles } from "lucide-react";
import Auth from "./Auth";

const PROMPT = "Listen to the spoken question and answer it based on the image. Give a short, simple answer.";
type FileValue = File | null;
type User = { id: number; name: string; email: string };

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("multimodel_token") || "");
  const [user, setUser] = useState<User | null>(() => { const stored = localStorage.getItem("multimodel_user"); return stored ? JSON.parse(stored) : null; });
  const [image, setImage] = useState<FileValue>(null), [audio, setAudio] = useState<FileValue>(null), [preview, setPreview] = useState("");
  const [answer, setAnswer] = useState(""), [answerAudio, setAnswerAudio] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null), recordingChunks = useRef<Blob[]>([]);
  useEffect(() => { if (!image) { setPreview(""); return; } const url = URL.createObjectURL(image); setPreview(url); return () => URL.revokeObjectURL(url); }, [image]);
  const pick = (kind: "image" | "audio") => (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0] ?? null; kind === "image" ? setImage(file) : setAudio(file); setError(""); };
  const drop = (kind: "image" | "audio") => (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); const file = event.dataTransfer.files[0] ?? null; if (file && ((kind === "image" && file.type.startsWith("image/")) || (kind === "audio" && file.type.startsWith("audio/")))) kind === "image" ? setImage(file) : setAudio(file); };
  const toggleRecording = async () => {
    if (recording && recorder.current) { recorder.current.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError("This browser does not support microphone recording."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recordingChunks.current = [];
      mediaRecorder.ondataavailable = event => { if (event.data.size) recordingChunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setAudio(new File([blob], "voice-question.webm", { type: blob.type }));
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
      };
      recorder.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setError("");
    } catch { setError("Microphone access was denied. Allow microphone access in your browser and try again."); }
  };
  const analyze = async () => {
    if (!image || !audio) { setError("Add one image and one spoken question first."); return; }
    setBusy(true); setError(""); setAnswer("");
    const form = new FormData(); form.append("image", image); form.append("audio", audio); form.append("instruction", PROMPT);
    try { const response = await fetch("/api/analyze", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.detail); setAnswer(data.answer); setAnswerAudio(data.audio ? `data:audio/mpeg;base64,${data.audio}` : ""); if (!data.audio) window.speechSynthesis?.speak(new SpeechSynthesisUtterance(data.answer)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The service could not process those files."); } finally { setBusy(false); }
  };
  const reset = () => { setImage(null); setAudio(null); setAnswer(""); setAnswerAudio(""); setError(""); };
  const authenticate = (newToken: string, newUser: User) => { localStorage.setItem("multimodel_token", newToken); localStorage.setItem("multimodel_user", JSON.stringify(newUser)); setToken(newToken); setUser(newUser); };
  const logout = () => { localStorage.removeItem("multimodel_token"); localStorage.removeItem("multimodel_user"); setToken(""); setUser(null); };
  if (!token || !user) return <Auth onAuthenticated={authenticate} />;
  return <main className="shell">
    <header><div className="brand"><span><WandSparkles size={17} /></span>multimodel</div><div className="model"><i /> {user.name} <button className="logout" onClick={logout}>Log out</button></div></header>
    <section className="hero"><div className="eyebrow"><Sparkles size={14} /> image + voice intelligence</div><h1>See it.<br /><em>Hear it.</em><br />Answer it.</h1><p>Show the model a scene and ask a spoken question. Hear a clear answer back, with a text transcript alongside it.</p></section>
    <section className="work"><div><div className="kicker"><b>01</b> Feed the model</div><div className="uploads">
      <label className="drop image-drop" onDragOver={e => e.preventDefault()} onDrop={drop("image")}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick("image")} />{preview ? <img src={preview} alt="Selected scene" /> : <div className="drop-copy"><span><ImagePlus size={24} /></span><strong>Drop a scene</strong><small>JPG, PNG, or WebP</small></div>}{image && <div className="file"><Check size={13} /> {image.name}</div>}</label>
      <label className="drop audio-drop" onDragOver={e => e.preventDefault()} onDrop={drop("audio")}><input type="file" accept="audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/webm" onChange={pick("audio")} /><div className="bars">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ height: `${20 + (i * 19) % 55}%` }} />)}</div><div className="drop-copy"><span><Mic2 size={24} /></span><strong>{audio ? audio.name : "Drop a question"}</strong><small>{audio ? "Audio ready" : "WAV, MP3, M4A, or WebM"}</small></div></label>
    </div><button className={`record-button ${recording ? "recording" : ""}`} type="button" onClick={toggleRecording}>{recording ? <><span className="record-dot" /> Stop recording</> : <><Mic2 size={16} /> Record with microphone</>}</button><div className="actions"><button onClick={analyze} disabled={busy || recording}>{busy ? <><LoaderCircle className="spin" size={17} /> Listening and seeing...</> : <><Play size={17} fill="currentColor" /> Analyze inputs</>}</button><button className="reset" onClick={reset}><RotateCcw size={16} /> Reset</button></div>{error && <p className="error">{error}</p>}</div>
    <div><div className="kicker"><b>02</b> Hear the answer</div><div className="answer">{answer ? <><div className="answer-label"><AudioLines size={16} /> spoken answer</div><p>{answer}</p>{answerAudio ? <div className="player"><AudioLines size={18} /><div><strong>Generated voice</strong><small>gTTS audio response</small></div><audio controls src={answerAudio} /></div> : <div className="player"><AudioLines size={18} /><div><strong>Browser voice</strong><small>Generated audio was unavailable, so your browser read the answer aloud.</small></div></div>}</> : <div className="empty"><span><UploadCloud size={25} /></span><strong>Your answer will land here</strong><p>Upload both inputs, then let the model connect what it sees with what it hears.</p></div>}</div></div></section>
    <footer><span>Multimodel studio</span><span>Gemini + gTTS</span></footer>
  </main>;
}
