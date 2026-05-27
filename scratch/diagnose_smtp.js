const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

async function main() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log("Configured SMTP User:", user);
  console.log("Configured SMTP Pass Length:", pass ? pass.length : 0);

  console.log("Trying standard host/port configuration...");
  const transporter = nodemailer.createTransport({
    host: host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // false for 587
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("✅ Standard SMTP Transporter verified successfully!");

    console.log("Sending a test mail via standard configuration...");
    const info = await transporter.sendMail({
      from: `"GrubSpot Test" <${user}>`,
      to: user,
      subject: "Test SMTP Connection (Port 587)",
      text: "This is a test email from GrubSpot SMTP diagnostics using port 587."
    });
    console.log("✅ Mail sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Connection or Send failed:", err);
  }
}

main();
