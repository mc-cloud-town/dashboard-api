// import fs from 'fs';
import { createTransport } from 'nodemailer';

export async function sendVerifyEmail(name: string, toEmail: string) {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || 'CTEC Account <admin@mc-ctec.org>';

  const transport = createTransport({
    host: host,
    port: port ? parseInt(port) : undefined,
    auth: { user, pass: password },
  });

  await transport.sendMail({
    from: from,
    to: toEmail,
    // subject: subject[locale],
    // html: emailHtml,
  });
}
