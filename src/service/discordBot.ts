import { Request } from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import logger from './logger';

export const CTEC_DISCORD_GUILD_ID = '933290709589577728';
export const CTEC_DISCORD_INTERNAL_ROLES = [
  '933382711148695673', // 雲鎮伙伴-member
  '1049504039211118652', // 二審中-trialing
];

export class DiscordBot extends Client {
  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    });

    this.on('ready', ({ user }) => {
      logger.info(`Logged in as ${user.tag}!`);
    });
  }

  static getBot(req: Request): DiscordBot {
    return req.app.get(BOT_ID_KEY);
  }

  async hasCTECMember(userID?: string) {
    if (!userID) {
      return false;
    }

    const members = this.guilds.cache.get(CTEC_DISCORD_GUILD_ID)?.members;
    if (!members) {
      return false;
    }

    let user = members.cache.get(userID);
    if (!user) {
      user = await members.fetch(userID).catch(() => void 0);
    }

    if (user) {
      const roles = user.roles.cache;

      return CTEC_DISCORD_INTERNAL_ROLES.some((role) => roles.has(role));
    }

    return false;
  }
}

export const BOT_ID_KEY = 'discordBot';
export default DiscordBot;
