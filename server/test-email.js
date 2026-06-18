import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log("Testing Gmail with:");
console.log("  GMAIL_USER:", process.env.GMAIL_USER);
console.log("  ADMIN_EMAIL:", process.env.ADMIN_EMAIL);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

try {
  await transporter.verify();
  console.log("✅ Gmail connection verified successfully!");

  await transporter.sendMail({
    from: `"Viraj Support" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "✅ Viraj Ticket System — Email Test",
    html: `<div style="font-family:sans-serif;padding:20px">
      <h2 style="color:#1a1f2e">Email Test Successful!</h2>
      <p>Your Viraj Profiles Ticket Tracking System email notifications are working correctly.</p>
      <p style="color:#888;font-size:12px">This is a test email sent at ${new Date().toLocaleString()}</p>
    </div>`,
  });

  console.log("✅ Test email sent to:", process.env.ADMIN_EMAIL);
} catch (err) {
  console.error("❌ Gmail error:", err.message);
}
