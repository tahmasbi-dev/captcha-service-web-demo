export const dynamic = "force-dynamic";

export async function POST() {
  const base = process.env.CAPTCHA_SERVICE_URL;
  if (!base) {
    return Response.json(
      { code: "config_error", detail: "CAPTCHA_SERVICE_URL is not set" },
      { status: 500 }
    );
  }

  const res = await fetch(`${base}/v1/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      code: "upstream_error",
      detail: "Captcha service is unreachable",
    }));
    return Response.json(err, { status: res.status });
  }

  const data = (await res.json()) as {
    challenge_id: string;
    image: string;
    expires_at: string;
  };

  return Response.json({
    challengeId: data.challenge_id,
    image: data.image,
    expiresAt: data.expires_at,
  });
}