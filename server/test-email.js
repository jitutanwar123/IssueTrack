import dotenv from "dotenv";
dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

console.log("Testing Brevo with:");
console.log("  BREVO_API_KEY:", BREVO_API_KEY ? "set" : "NOT SET");
console.log("  BREVO_FROM_EMAIL:", BREVO_FROM_EMAIL || "NOT SET");
console.log("  ADMIN_EMAIL:", ADMIN_EMAIL || "NOT SET");

if (!BREVO_API_KEY || !BREVO_FROM_EMAIL || !ADMIN_EMAIL) {
  console.error("❌ Missing Brevo configuration");
  process.exitCode = 1;
} else {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Viraj IT Support", email: BREVO_FROM_EMAIL },
        to: [{ email: ADMIN_EMAIL }],
        subject: "✅ Viraj Ticket System — Brevo Test",
        htmlContent: `<div style="font-family:sans-serif;padding:20px">
          <h2 style="color:#1a1f2e">Brevo Email Test Successful</h2>
          <p>Your Viraj Profiles Ticket Tracking System can send mail through Brevo.</p>
          <p style="color:#888;font-size:12px">Sent at ${new Date().toLocaleString()}</p>
        </div>`,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Brevo ${response.status}: ${data.message || JSON.stringify(data)}`);
    }

    console.log("✅ Test email sent to:", ADMIN_EMAIL);
    console.log("✅ Brevo messageId:", data.messageId || "(not provided)");
  } catch (err) {
    console.error("❌ Brevo error:", err.message);
    process.exitCode = 1;
  }
}
