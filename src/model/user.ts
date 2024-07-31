import { Snowflake } from 'discord.js';
import { Model, Schema, model } from 'mongoose';

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
  return '';
};

userSchema.methods.getAuthInfo = function () {
  return { ...this.getPublicInfo(), email: this.email };
};

userSchema.methods.getPublicInfo = function () {
  return {
    id: this.id,
    name: this.name,
    avatar: this.avatar,
    mcUUID: this.mcUUID,
  };
};

export const UserModule = model<IUser>('User', userSchema);

export default UserModule;

export interface IPublicUser {
  id: Snowflake;
  name: string;
  avatar?: Buffer;
  mcUUID?: string;
}

export interface IAuthUser extends IPublicUser {
  email: string;
}

export interface IUser extends IAuthUser {}

export interface IUserMethods {
  generateJWT(): string;
  getAuthInfo(): IAuthUser;
  getPublicInfo(): IPublicUser;
}

type UserModelType = Model<IUser, unknown, IUserMethods>;
