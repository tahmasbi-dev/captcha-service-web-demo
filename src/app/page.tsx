"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Challenge = { challengeId: string; image: string; expiresAt: string };

export default function LoginPage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | "success" | "failure">(null);

  async function loadChallenge() {
    setMessage(null);
    setAnswer("");
    try {
      const res = await fetch("/api/captcha/challenge", { method: "POST" });
      if (!res.ok) throw new Error("Could not load a captcha; is the service running?");
      setChallenge(await res.json());
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  useEffect(() => {
    loadChallenge();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge || busy || result === "success") return;
    setBusy(true);
    setMessage(null);

    try {
      const solveRes = await fetch("/api/captcha/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          solution: answer.trim().toUpperCase(),
        }),
      });

      if (!solveRes.ok) {
        setMessage((await solveRes.json())?.detail ?? "Captcha answer was wrong.");
        await loadChallenge();
        return;
      }

      const { token } = await solveRes.json();

      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          challengeId: challenge.challengeId,
          token,
        }),
      });
      const out = await loginRes.json();

      if (out.ok) {
        // 👇 Real success effect: show confirmation briefly, then navigate away.
        setResult("success");
        setMessage(null);
        setTimeout(() => router.replace("/dashboard"), 700);
        return;
      }

      setResult("failure");
      setMessage(out.detail ?? "Login failed.");
      await loadChallenge();
    } catch {
      setMessage("Something went wrong; try again.");
      await loadChallenge();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <h1>Sign in</h1>

      {result === "success" && (
        <div className="banner success">Login successful — redirecting…</div>
      )}
      {result === "failure" && <div className="banner failure">Login failed.</div>}

      <form onSubmit={onSubmit}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={result === "success"}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={result === "success"}
            required
          />
        </label>

        <div className="captcha">
          {challenge ? (
            <img src={challenge.image} alt="Captcha challenge" />
          ) : (
            <p className="message">Loading captcha…</p>
          )}
        </div>
        <label>
          Type the characters
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={32}
            disabled={!challenge || result === "success"}
            required
          />
        </label>

        <button type="submit" disabled={!challenge || busy || result === "success"}>
          {busy ? "Checking…" : result === "success" ? "Signed in" : "Sign in"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </main>
  );
}