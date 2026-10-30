export async function POST(req: Request) {
  const base = process.env.CAPTCHA_SERVICE_URL;
  if (!base) {
    return Response.json(
      { code: "config_error", detail: "CAPTCHA_SERVICE_URL is not set" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const challengeId = body?.challengeId;
  const solution = typeof body?.solution === "string" ? body.solution : "";
  if (typeof challengeId !== "string" || solution.length < 1 || solution.length > 32) {
    return Response.json(
      { code: "bad_request", detail: "challengeId and solution (1–32 chars) required" },
      { status: 400 }
    );
  }

  const res = await fetch(`${base}/v1/challenges/${challengeId}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", solution }),
  });

  if (!res.ok) {
    // 400 = wrong answer (challenge burned), 409 = not solvable, 404 = unknown id
    const err = await res.json().catch(() => ({
      code: "upstream_error",
      detail: "Solve failed",
    }));
    return Response.json(err, { status: res.status });
  }

  const data = (await res.json()) as { token: string; expires_at: string };
  return Response.json({ token: data.token, expiresAt: data.expires_at });
}