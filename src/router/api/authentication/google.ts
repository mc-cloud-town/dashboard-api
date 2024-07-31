import axios from 'axios';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ResponseStatusCode, sendRes } from '#/utils';

const router = Router();

const clientID = process.env.GOOGLE_OAUTH_ID ?? '';
const clientSecret = process.env.GOOGLE_OAUTH_SECRET ?? '';
const REDIRECT_URL = process.env.GOOGLE_OAUTH_REDIRECT_URL ?? '';

const GOOGLE_AUTH_URL_PREFIX = 'https://accounts.google.com/o/oauth2/auth';
const GOOGLE_BASE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_BASE_SCOPE_URI = 'https://www.googleapis.com/auth/';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_AUTH_SCOPE = `${GOOGLE_BASE_SCOPE_URI}userinfo.profile ${GOOGLE_BASE_SCOPE_URI}userinfo.email`;
const GOOGLE_AUTH_URL_LOGIN = `${GOOGLE_AUTH_URL_PREFIX}?${new URLSearchParams({
  client_id: clientID,
  scope: GOOGLE_AUTH_SCOPE,
  response_type: 'code',
  redirect_uri: REDIRECT_URL,
}).toString()}`;

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
    data: GOOGLE_AUTH_URL_LOGIN,
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
    const responseAccessInfo = await axios.postForm(GOOGLE_BASE_TOKEN_URL, {
      code,
      client_id: clientID,
      redirect_uri: REDIRECT_URL,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
    });
    const accessInfo = responseAccessInfo.data;
    if (accessInfo.access_token) {
      const accountInfo = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `${accessInfo.token_type} ${accessInfo.access_token}`,
        },
      });

      sendRes(res, {
        code: ResponseStatusCode.SUCCESS,
        data: {
          ...accountInfo.data,
        },
      });
      return;
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
