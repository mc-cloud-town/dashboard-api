import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseStatusCode, sendRes } from '#/utils';
import { Oauth2, Oauth2Type } from './_oauth';

import User from '@/model/user';
import { DiscordBot } from '@/service';

const router = Router();

const CLIENT_ID = process.env.GOOGLE_OAUTH_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_SECRET;
const REDIRECT_URL = process.env.GOOGLE_OAUTH_REDIRECT_URL;

const GOOGLE_OAUTH2 = new Oauth2(Oauth2Type.GOOGLE, {
  clientID: CLIENT_ID ?? '',
  redirectURI: REDIRECT_URL ?? '',
  clientSecret: CLIENT_SECRET ?? '',
  scopes: ['userinfo.email'],
});

router.get('/login', (_req, res) => {
  // #swagger.description = 'Get Google OAuth URL.';

  if (!CLIENT_SECRET || !CLIENT_ID) {
    sendRes(
      res,
      { code: ResponseStatusCode.GET_AUTH_URL_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return;
  }

  /* #swagger.responses[200] = {
    description: 'Get Google OAuth URL.',
    schema: {
      code: 0,
      data: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=CLIENT_ID&redirect_uri=REDIRECT_URL&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email',
    }
  }; */
  sendRes(res, {
    code: ResponseStatusCode.SUCCESS,
    data: GOOGLE_OAUTH2.AUTH_URL,
  });
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  // const locale = req.query.locale;

  if (typeof code !== 'string') {
    sendRes(
      res,
      {
        code: ResponseStatusCode.OAUTH_CODE_CALLBACK_ERROR,
        data: 'Missing code or redirect URI',
      },
      StatusCodes.BAD_REQUEST,
    );
    return;
  }

  if (!CLIENT_SECRET || !CLIENT_ID) {
    sendRes(
      res,
      { code: ResponseStatusCode.OAUTH_CODE_CALLBACK_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return;
  }

  const { data: accessInfo } = await GOOGLE_OAUTH2.getAccessToken(code);
  if (accessInfo?.access_token) {
    const { data: accountInfo } = await GOOGLE_OAUTH2.getUserInfo(accessInfo);

    const googleEmail = accountInfo?.email;
    if (googleEmail) {
      const bot = DiscordBot.getBot(req);
      const user = await User.findOne({ googleEmail });

      if (user) {
        if (await bot.hasCTECMember(user.id)) {
          if (user.verifiedEmail) {
            sendRes(res, {
              code: ResponseStatusCode.SUCCESS,
              data: {
                token: user.generateJWT(),
                user: user.getPublicInfo(),
              },
            });
          } else {
            sendRes(
              res,
              {
                code: ResponseStatusCode.AUTH_EMAIL_NOT_VERIFIED,
                data: 'Please verify your email first',
              },
              StatusCodes.BAD_REQUEST,
            );
          }
          return;
        }
        await user.deleteOne();
      }
    }
  }

  sendRes(
    res,
    { code: ResponseStatusCode.AUTH_ERROR },
    StatusCodes.BAD_REQUEST,
  );
});

export default router;
