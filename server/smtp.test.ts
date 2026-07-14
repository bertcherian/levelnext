import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("Brevo SMTP configuration", () => {
  it("should verify SMTP connection successfully", async () => {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    expect(host).toBeTruthy();
    expect(user).toBeTruthy();
    expect(pass).toBeTruthy();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // verify() opens a connection and checks credentials without sending an email
    await expect(transporter.verify()).resolves.toBe(true);
  }, 15000);
});
