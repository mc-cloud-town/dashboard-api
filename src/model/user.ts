import { createJWTToken } from '@/util/jwt';
import { Snowflake } from 'discord.js';
import { HydratedDocument, Model, Schema, model } from 'mongoose';

const userSchema = new Schema<IUser, UserModelType, IUserMethods>({
  id: { type: String, required: true },
  name: {
    type: String,
    unique: true,
    index: true,
    required: [true, "can't be blank"],
  },
  email: {
    type: String,
    unique: true,
    index: true,
    required: [true, "can't be blank"],
    match: [/\S+@\S+\.\S+/, 'is invalid'],
  },
  mcUUID: { type: String, required: false },
  avatar: { type: Buffer, required: false },
});

userSchema.methods.generateJWT = function () {
  return createJWTToken(this.id);
};

userSchema.methods.getAuthInfo = function () {
  return { ...this.getPublicInfo(), email: this.email };
};

userSchema.methods.getPublicInfo = function () {
  return { id: this.id, name: this.name, mcUUID: this.mcUUID };
};

export const User = model<IUser, UserModelType>('User', userSchema);

export default User;

export interface IPublicUser {
  id: Snowflake;
  name: string;
  avatar?: Buffer;
  mcUUID?: string;
}

export interface IAuthUser extends IPublicUser {
  email?: string;
}

export interface IUser extends IAuthUser {}

export interface IUserMethods {
  generateJWT(): string;
  getAuthInfo(): IAuthUser;
  getPublicInfo(): IPublicUser;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type UserModelType = Model<IUser, {}, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;
