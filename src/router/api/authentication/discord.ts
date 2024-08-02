import axios from 'axios';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { DiscordBot, logger } from '@/service';
import { ResponseStatusCode, sendRes } from '#/utils';
import User from '@/model/user';
import { createJWTToken } from '@/util/jwt';
import { Oauth2, Oauth2Type } from './_oauth';

const router = Router();

const CLIENT_ID = process.env.DISCORD_OAUTH_ID;
const REDIRECT_URL = process.env.DISCORD_OAUTH_REDIRECT_URL;
const CLIENT_SECRET = process.env.DISCORD_OAUTH_SECRET;

const DISCORD_OAUTH2 = new Oauth2(Oauth2Type.DISCORD, {
  clientID: CLIENT_ID ?? '',
  redirectURI: REDIRECT_URL ?? '',
  clientSecret: CLIENT_SECRET ?? '',
  scopes: ['email'],
});

router.get('/login', (_req, res) => {
  if (!CLIENT_SECRET || !CLIENT_ID) {
    sendRes(
      res,
      { code: ResponseStatusCode.GET_AUTH_URL_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return;
  }

  sendRes(res, {
    code: ResponseStatusCode.SUCCESS,
    data: DISCORD_OAUTH2.AUTH_URL,
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
        data: 'Missing code',
      },
      StatusCodes.BAD_REQUEST,
    );
    return;
  }

  if (typeof req.query.error === 'string') {
    sendRes(
      res,
      {
        code: ResponseStatusCode.OAUTH_CODE_CALLBACK_ERROR,
        data: req.query.error,
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

  const { data: accessInfo } = await DISCORD_OAUTH2.getAccessToken(code);
  if (accessInfo) {
    const bot = DiscordBot.getBot(req);
    const { data: accountInfo } = await DISCORD_OAUTH2.getUserInfo(accessInfo);

    if (accountInfo) {
      if (!(await bot.hasCTECMember(accountInfo.id))) {
        sendRes(
          res,
          {
            code: ResponseStatusCode.NOT_CTEC_MEMBER,
            data: 'Not is CTEC Member',
          },
          StatusCodes.FORBIDDEN,
        );
        return;
      }
      const { id, email, username, global_name } = accountInfo;
      let user = await User.findOne({ id: accountInfo.id });

      if (!user) {
        let avatar: Buffer | undefined;
        if (accountInfo.avatar) {
          avatar = await axios
            .get(
              `https://cdn.discordapp.com/avatars/${id}/${accountInfo.avatar}.png`,
              { responseType: 'arraybuffer' },
            )
            .then(({ data }) => Buffer.from(data, 'binary'))
            .catch(() => void 0);
        }

        try {
          user = await User.create({
            id,
            avatar,
            name: username,
            showName: global_name,
            email: email ?? void 0,
          });
        } catch (e) {
          logger.error(e);
        }
      }

      if (user) {
        sendRes(
          res,
          {
            code: ResponseStatusCode.SUCCESS,
            data: {
              token: createJWTToken(accountInfo.id),
              user: user.getAuthInfo(),
            },
          },
          StatusCodes.OK,
        );
      }
      return;
    }
  }

  sendRes(
    res,
    { code: ResponseStatusCode.AUTH_ERROR },
    StatusCodes.BAD_REQUEST,
  );
});

export default router;
