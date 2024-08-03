import fs from 'fs';
import { createTransport, SendMailOptions } from 'nodemailer';

export const getTransport = () => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  return createTransport({
    host,
    port: port ? parseInt(port) : undefined,
    auth: { user, pass },
  });
};

export const readMailTemplate = async (
  type: string,
  locale: string = 'zh-TW',
  options?: { [key: string]: string },
) => {
  return fs
    .readFileSync(`assets/mail/${type}/${locale}.html`, 'utf8')
    .replaceAll(
      /\${([a-zA-Z0-9_]+)}/g,
      (old, match) => options?.[match] ?? old,
    );
};

export const verifyEmail = async (email: string) => {
  const from = process.env.EMAIL_FROM || '雲鎮 工藝 <admin@mc-ctec.org>';
  const mailOptions: SendMailOptions = {
    from,
    to: email,
    subject: '雲鎮工藝 驗證信',
    html: await readMailTemplate('verify', 'zh-TW', {
      url: '',
    }),
  };
  await getTransport().sendMail(mailOptions);
};

export async function sendPass2Email(
  name: string,
  email: string,
  locale: string = 'zh-TW',
) {
  const from = process.env.EMAIL_FROM || '雲鎮 工藝 <admin@mc-ctec.org>';
  const subject: { [key: string]: string } = {
    'en-US': 'Welcome to CloudTown',
    'zh-TW': '歡迎加入雲鎮工藝',
  };

  const mailOptions: SendMailOptions = {
    from,
    to: email,
    subject: subject[locale],
    html: await readMailTemplate('pass-2', 'zh-TW', {
      seed: process.env.WORLD_SEED || '-',
      dcName: name,
    }),
  };
  await getTransport().sendMail(mailOptions);
}
