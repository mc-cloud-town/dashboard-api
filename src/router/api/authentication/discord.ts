import axios, { AxiosRequestConfig } from 'axios';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  APIUser,
  RESTPostOAuth2AccessTokenResult,
  RESTPostOAuth2AccessTokenURLEncodedData,
} from 'discord.js';

import { DiscordBot } from '@/service';
import { ResponseStatusCode, sendRes } from '#/utils';

const router = Router();

const clientID = process.env.DISCORD_OAUTH_ID;
const clientSecret = process.env.DISCORD_OAUTH_SECRET;
const REDIRECT_URL = process.env.DISCORD_OAUTH_REDIRECT_URL;

const DISCORD_AUTH_URL_PREFIX = 'https://discord.com/oauth2/authorize';
const DISCORD_BASE_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_USERINFO_URL = 'https://discord.com/api/users/@me';
const DISCORD_AUTH_SCOPE = 'email'; // identify
const DISCORD_AUTH_URL_LOGIN = `${DISCORD_AUTH_URL_PREFIX}?${new URLSearchParams(
  {
    client_id: clientID ?? '',
    scope: DISCORD_AUTH_SCOPE ?? '',
    response_type: 'code',
    redirect_uri: REDIRECT_URL ?? '',
    prompt: 'consent',
  },
).toString()}`;

router.get('/login', (_req, res) => {
  if (!clientSecret || !clientID) {
    sendRes(
      res,
      { code: ResponseStatusCode.GET_AUTH_URL_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return;
  }

  sendRes(res, {
    code: ResponseStatusCode.SUCCESS,
    data: DISCORD_AUTH_URL_LOGIN,
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

  if (!clientSecret || !clientID) {
    sendRes(
      res,
      { code: ResponseStatusCode.OAUTH_CODE_CALLBACK_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return;
  }

  try {
    const { data: accessInfo } = await axios.postForm<
      RESTPostOAuth2AccessTokenResult,
      AxiosRequestConfig<RESTPostOAuth2AccessTokenResult>,
      RESTPostOAuth2AccessTokenURLEncodedData
    >(DISCORD_BASE_TOKEN_URL, {
      code,
      client_id: clientID,
      redirect_uri: REDIRECT_URL,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
    });

    if (accessInfo) {
      const { data: accountInfo } = await axios.get<APIUser>(
        DISCORD_USERINFO_URL,
        {
          headers: {
            Authorization: `${accessInfo.token_type} ${accessInfo.access_token}`,
          },
        },
      );

      const bot = DiscordBot.getBot(req);

      if (await bot.hasCTECMember(accountInfo?.id)) {
        sendRes(res, {
          code: ResponseStatusCode.SUCCESS,
          data: { ...accountInfo, ...accessInfo },
        });
        return;
      }
    }
  } catch (_error) {
    /* empty */
  }

  sendRes(
    res,
    { code: ResponseStatusCode.AUTH_ERROR },
    StatusCodes.BAD_REQUEST,
  );
});

export default router;
