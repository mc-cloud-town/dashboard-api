import { createJWTToken } from '@/util/jwt';
import { Snowflake } from 'discord.js';
import { HydratedDocument, Model, Schema, model } from 'mongoose';

const userSchema = new Schema<IUser, UserModelType, IUserMethods>({
  id: { type: String, unique: true, index: true, required: true },
  name: { type: String, unique: true, required: [true, "can't be blank"] },
  showName: { type: String, required: [true, "can't be blank"] },
  googleEmail: {
    type: String,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'],
  },
  verifiedEmail: { type: Boolean, default: false },
  lastSentVerifyEmailTime: { type: Date, required: false },
  mcUUID: { type: String, required: false },
  avatar: { type: Buffer, required: false },
});

userSchema.methods.generateJWT = function () {
  return createJWTToken(this.id);
};

userSchema.methods.getAuthInfo = function () {
  return {
    ...this.getPublicInfo(),
    email: this.googleEmail,
    verifiedEmail: this.verifiedEmail,
  };
};

userSchema.methods.getPublicInfo = function () {
  return {
    id: this.id,
    name: this.name,
    showName: this.showName,
    mcUUID: this.mcUUID,
  };
};

userSchema.methods.canSendVerifyEmail = function () {
  if (this.lastSentVerifyEmailTime) {
    const diff = new Date().getTime() - this.lastSentVerifyEmailTime.getTime();

    // over 10 minutes
    return diff > 1000 * 60 * 10;
  } else return true;
};

export const User = model<IUser, UserModelType>('User', userSchema);

export default User;

export interface IPublicUser {
  id: Snowflake;
  name: string;
  showName: string;
  avatar?: Buffer;
  mcUUID?: string;
}

export interface IAuthUser extends IPublicUser {
  googleEmail?: string;
  verifiedEmail: boolean;
}

export interface IUser extends IAuthUser {
  lastSentVerifyEmailTime?: Date;
}

export interface IUserMethods {
  generateJWT(): string;
  getAuthInfo(): IAuthUser;
  getPublicInfo(): IPublicUser;
  canSendVerifyEmail(): boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type UserModelType = Model<IUser, {}, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;
