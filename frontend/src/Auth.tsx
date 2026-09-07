import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Sparkles, WandSparkles } from "lucide-react";

type User = { id: number; name: string; email: string };
type Props = { onAuthenticated: (token: string, user: User) => void };

export default function Auth({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(); form.append("email", email); form.append("password", password); if (mode === "signup") form.append("name", name);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", body: form });
      const body = await response.text();
      let data: { detail?: string; token?: string; user?: User } = {};
      try { data = body ? JSON.parse(body) : {}; } catch { data = {}; }
      if (!response.ok) throw new Error(data.detail || `Backend returned HTTP ${response.status}. Start the FastAPI server on port 8000.`);
      if (!data.token || !data.user) throw new Error("The backend returned an incomplete login response.");
      onAuthenticated(data.token, data.user);
    }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to authenticate."); } finally { setBusy(false); }
  };
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at 10% 0%, #fff9ee, transparent 38%), #f3eee4" }}>
    <section style={{ width: "min(440px, 100%)", background: "#252421", color: "#f8f1e6", padding: "38px 34px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 17 }}><span style={{ width: 29, height: 29, borderRadius: "50%", display: "grid", placeItems: "center", background: "#e35236" }}><WandSparkles size={17} /></span>multimodel</div>
      <div style={{ color: "#f17c64", font: "11px 'DM Mono', monospace", textTransform: "uppercase", letterSpacing: ".12em", marginTop: 54, display: "flex", gap: 8 }}><Sparkles size={14} /> private studio</div>
      <h1 style={{ font: "500 42px/1 Fraunces, serif", letterSpacing: "-.04em", margin: "16px 0 10px" }}>{mode === "login" ? "Welcome back." : "Make it yours."}</h1>
      <p style={{ color: "#aaa198", fontSize: 14, lineHeight: 1.5, marginBottom: 28 }}>{mode === "login" ? "Sign in to keep your multimodal sessions together." : "Create an account for your own private analysis history."}</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        {mode === "signup" && <input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" required minLength={2} style={inputStyle} />}
        <input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" type="email" required style={inputStyle} />
        <input value={password} onChange={event => setPassword(event.target.value)} placeholder="Password (8+ characters)" type="password" required minLength={8} style={inputStyle} />
        <button disabled={busy} style={{ height: 47, border: 0, background: "#e35236", color: "#fffaf1", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: "pointer", marginTop: 5 }}>{busy ? "Working..." : <>{mode === "login" ? "Enter studio" : "Create account"}<ArrowRight size={17} /></>}</button>
      </form>
      {error && <p style={{ color: "#ff9a85", fontSize: 12 }}>{error}</p>}
      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ background: "none", border: 0, color: "#aaa198", padding: "20px 0 0", cursor: "pointer", fontSize: 12 }}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
      <div style={{ color: "#756e64", fontSize: 11, marginTop: 28, display: "flex", gap: 7, alignItems: "center" }}><LockKeyhole size={13} /> Your account data stays isolated from other users.</div>
    </section>
  </main>;
}

const inputStyle = { height: 45, border: "1px solid #4b4640", background: "#302e2a", color: "#f8f1e6", padding: "0 13px", outline: "none", font: "13px 'DM Sans', sans-serif" };
