export async function POST(req: Request) {
  const base = process.env.CAPTCHA_SERVICE_URL;
  const internalKey = process.env.CAPTCHA_INTERNAL_API_KEY;
  if (!base || !internalKey) {
    return Response.json(
      { ok: false, code: "config_error", detail: "Captcha service env vars are not set" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const { username, password, challengeId, token } = body ?? {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof challengeId !== "string" ||
    typeof token !== "string" ||
    token.length < 16
  ) {
    return Response.json(
      { ok: false, code: "bad_request", detail: "username, password, challengeId and token are required" },
      { status: 400 }
    );
  }

  // 1. Redeem the captcha proof server-to-server. This consumes the challenge:
  //    exactly one successful verify per solved challenge.
  const res = await fetch(`${base}/v1/internal/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": internalKey,
    },
    body: JSON.stringify({ challenge_id: challengeId, action: "login", token }),
  });

  const verify = await res.json().catch(() => ({ valid: false }));

  if (!res.ok || verify.valid !== true) {
    return Response.json({
      ok: false,
      failed: "captcha",
      detail: verify.detail ?? "Captcha verification failed.",
    });
  }

  // 2. Demo credential check (no user store yet — replace with real auth later).
  const demoUser = process.env.DEMO_USERNAME ?? "demo";
  const demoPass = process.env.DEMO_PASSWORD ?? "demo";
  if (username === demoUser && password === demoPass) {
    return Response.json({ ok: true });
  }

  return Response.json({
    ok: false,
    failed: "credentials",
    detail: "Wrong username or password.",
  });
}