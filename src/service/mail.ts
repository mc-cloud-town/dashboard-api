import fs from 'fs';
import { createTransport } from 'nodemailer';

export async function sendPass2Email(
  name: string,
  toEmail: string,
  locale: string = 'zh-TW',
) {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || '雲鎮 工藝 <admin@mc-ctec.org>';

  const emailHtml = fs
    .readFileSync('assets/mail/pass-2/zh-TW.html', 'utf8')
    .replaceAll('${seed}', process.env.WORLD_SEED || '-')
    .replaceAll('${dcName}', name);

  const transport = createTransport({
    host: host,
    port: port ? parseInt(port) : undefined,
    auth: { user, pass: password },
  });

  const subject: { [key: string]: string } = {
    'en-US': 'Welcome to CloudTown',
    'zh-TW': '歡迎加入雲鎮工藝',
  };

  await transport.sendMail({
    from: from,
    to: toEmail,
    subject: subject[locale] ?? subject['zh-TW'],
    html: emailHtml,
  });
}
