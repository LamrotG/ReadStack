async function sendEmail(to, subject, html) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "ReadStack <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`);
    return;
  }
  console.log(`\n[dev] Email to ${to} — ${subject}\n  ${html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}\n`);
}

export async function sendMagicLinkEmail(email, link) {
  await sendEmail(
    email,
    "Your ReadStack sign-in link",
    `<p>Click to sign in (expires in 15 min):</p><p><a href="${link}">${link}</a></p>`
  );
}

export async function sendPasswordResetEmail(email, link) {
  await sendEmail(
    email,
    "Reset your ReadStack password",
    `<p>Click to reset your password (expires in 15 min):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p>`
  );
}
