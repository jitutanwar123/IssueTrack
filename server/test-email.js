import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL;

console.log("Testing Gmail SMTP with:");
console.log("  GMAIL_USER:", gmailUser || "NOT SET");
console.log("  GMAIL_APP_PASSWORD:", gmailPass ? "set" : "NOT SET");
console.log("  ADMIN_EMAIL:", adminEmail || "NOT SET");

if (!gmailUser || !gmailPass || !adminEmail) {
  console.error("❌ Missing Gmail SMTP configuration");
  process.exitCode = 1;
} else {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 1,
      maxMessages: 10,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"Viraj IT Support" <${gmailUser}>`,
      to: adminEmail,
      subject: "✅ Viraj Ticket System — Gmail SMTP Test",
      html: `<div style="font-family:sans-serif;padding:20px">
        <h2 style="color:#1a1f2e">Gmail SMTP Email Test Successful</h2>
        <p>Your Viraj Profiles Ticket Tracking System can send mail through Gmail SMTP.</p>
        <p style="color:#888;font-size:12px">Sent at ${new Date().toLocaleString()}</p>
      </div>`,
    });

    console.log("✅ Test email sent to:", adminEmail);
    console.log("✅ Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Gmail SMTP error:", err.message);
    process.exitCode = 1;
  }
}
