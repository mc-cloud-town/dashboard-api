import axios from 'axios';
import { APIUser } from 'discord.js';

const GOOGLE_BASE_SCOPE_URI = 'https://www.googleapis.com/auth/';

export class Oauth2<T extends Oauth2Type> {
  clientID: string;
  clientSecret: string;
  redirectURI: string;
  scope: string;

  readonly type: T;
  readonly AUTH_URL: string;

  constructor(type: T, options: IOauth2Options) {
    this.type = type;
    this.clientID = options.clientID;
    this.clientSecret = options.clientSecret;
    this.redirectURI = options.redirectURI;

    this.scope = this.getScope(options.scopes);
    this.AUTH_URL = this.getAuthURL();
  }

  getAuthURL() {
    return `${this.getPrefixURL()}?${new URLSearchParams({
      scope: this.scope,
      client_id: this.clientID,
      redirect_uri: this.redirectURI,
      prompt: 'consent',
      response_type: 'code',
    }).toString()}`;
  }

  getScope(scopes: string[]) {
    if (this.type === Oauth2Type.GOOGLE) {
      return scopes.map((scope) => GOOGLE_BASE_SCOPE_URI + scope).join(' ');
    }
    return scopes.join(' ');
  }

  async getAccessToken(code: string) {
    try {
      return await axios.postForm<IOauth2TypeAccessToken[T]>(
        this.getTokenURL(),
        {
          client_id: this.clientID,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectURI,
        },
      );
    } catch (e) {
      return { data: void 0 };
    }
  }

  async getUserInfo(accessToken: IOauth2TypeAccessToken[T]) {
    try {
      return await axios.get<IOauth2TypeUserInfo[T]>(this.getUserInfoURL(), {
        headers: {
          Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
        },
      });
    } catch {
      return { data: void 0 };
    }
  }

  private getPrefixURL() {
    switch (this.type) {
      case Oauth2Type.GOOGLE:
        return 'https://accounts.google.com/o/oauth2/v2/auth';
      case Oauth2Type.DISCORD:
      default:
        return 'https://discord.com/oauth2/authorize';
    }
  }

  private getTokenURL() {
    switch (this.type) {
      case Oauth2Type.GOOGLE:
        return 'https://oauth2.googleapis.com/token';
      case Oauth2Type.DISCORD:
      default:
        return 'https://discord.com/api/oauth2/token';
    }
  }

  private getUserInfoURL() {
    switch (this.type) {
      case Oauth2Type.GOOGLE:
        return 'https://www.googleapis.com/oauth2/v2/userinfo';
      case Oauth2Type.DISCORD:
      default:
        return 'https://discord.com/api/users/@me';
    }
  }
}

export interface IOauth2Options {
  clientID: string;
  clientSecret: string;
  redirectURI: string;
  scopes: string[];
}

export enum Oauth2Type {
  GOOGLE = 'GOOGLE',
  DISCORD = 'DISCORD',
}

export interface IOauth2TypeAccessToken {
  [Oauth2Type.GOOGLE]: IOauth2GoogleAccessToken;
  [Oauth2Type.DISCORD]: IOauth2DiscordAccessToken;
}

export interface IOauth2BaseAccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: 'Bearer';
  scope: string;
}

export interface IOauth2GoogleAccessToken extends IOauth2BaseAccessToken {}

export interface IOauth2DiscordAccessToken extends IOauth2BaseAccessToken {}

export interface IOauth2TypeUserInfo {
  [Oauth2Type.GOOGLE]: IOauth2GoogleUserInfo;
  [Oauth2Type.DISCORD]: APIUser;
}

export interface IOauth2GoogleUserInfo {
  id: string;
  verified_email: boolean;
  email: string;
  picture: string;
}
