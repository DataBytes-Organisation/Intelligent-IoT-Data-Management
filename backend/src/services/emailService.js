const nodemailer = require("nodemailer");

async function send({ to, purpose, secret }) {
  if (process.env.MAIL_PROVIDER === "disabled") {
    const error = new Error("Email service unavailable");
    error.code = "SERVICE_UNAVAILABLE";
    throw error;
  }
  // Test/development accepts delivery without persisting or logging secrets.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.MAIL_TRANSPORT !== "smtp"
  )
    return { accepted: [to], purpose };
  if (!process.env.MAIL_FROM || !process.env.SMTP_HOST) {
    const error = new Error("Email service is unavailable");
    error.code = "SERVICE_UNAVAILABLE";
    throw error;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  const isMfa = purpose === "mfa";
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: isMfa
      ? "Your Intelligent IoT verification code"
      : "Reset your Intelligent IoT password",
    text: isMfa
      ? `Your verification code is ${secret}. It expires in 10 minutes.`
      : `Use this password reset token within 30 minutes: ${secret}`,
  });
  return { accepted: [to], purpose };
}
module.exports = { send };
