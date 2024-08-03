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
  // #swagger.description = 'Get Discord OAuth URL.';

  if (!CLIENT_SECRET || !CLIENT_ID) {
    /* #swagger.responses[500] = {
      description: 'Internal server error',
      schema: {
        code: 2,
      },
    }; */

    sendRes(
      res,
      { code: ResponseStatusCode.GET_AUTH_URL_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    return;
  }

  /* #swagger.responses[200] = {
    description: 'Get Discord OAuth URL.',
    schema: {
      code: 0,
      data: 'https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URL&response_type=code&scope=identify%20email',
    },
  }; */
  sendRes(res, {
    code: ResponseStatusCode.SUCCESS,
    data: DISCORD_OAUTH2.AUTH_URL,
  });
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  // const locale = req.query.locale;

  if (typeof code !== 'string') {
    /* #swagger.responses[400] = {
      description: 'Not found code in query',
      schema: {
        code: 3,
        data: 'Missing code',
      },
    }; */

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
    /* #swagger.responses[400] = {
      description: 'Found error in query',
      schema: {
        code: 3,
        data: '<discord response error>',
      },
    }; */

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
    /* #swagger.responses[500] = {
      description: 'Internal server error',
      schema: {
        code: 2,
      },
    }; */

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
        /* #swagger.responses[403] = {
          description: 'Not is CTEC Member',
          schema: {
            code: 6,
            data: 'Not is CTEC Member',
          },
        }; */

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
        /* #swagger.responses[200] = {
          description: 'Success',
          schema: {
            code: 0,
            data: {
              token: 'JWT_TOKEN',
              user: {
                id: 'USER_ID',
                name: 'USER_NAME',
                email: 'USER_EMAIL',
                avatar: 'USER_AVATAR',
              },
            },
          },
        }; */

        sendRes(res, {
          code: ResponseStatusCode.SUCCESS,
          data: {
            token: createJWTToken(accountInfo.id),
            user: user.getAuthInfo(),
          },
        });
      }
      return;
    }
  }

  /* #swagger.responses[400] = {
    description: 'Not found access token',
    schema: {
      code: 3,
      data: 'Missing access token',
    },
  }; */
  sendRes(
    res,
    { code: ResponseStatusCode.AUTH_ERROR },
    StatusCodes.BAD_REQUEST,
  );
});

export default router;
