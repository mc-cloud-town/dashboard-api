import fs from 'fs';
import { generateKeyPairSync } from 'crypto';
import jwt from 'jsonwebtoken';

import { UserDocument, User } from '@/model/user';
import { logger } from '@/service';

let publicKey: string;
let privateKey: string;

const KEY_ROOT_PATH = 'data';
const PUBLIC_KEY_PATH = `${KEY_ROOT_PATH}/public_key.pem`;
const PRIVATE_KEY_PATH = `${KEY_ROOT_PATH}/private_key.pem`;

export const setupES256Key = () => {
  // Check if key pair already exists
  if (fs.existsSync(PUBLIC_KEY_PATH) && fs.existsSync(PRIVATE_KEY_PATH)) {
    publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    return;
  }

  // Generate new key pair
  logger.info('Generating new ES256 key pair...');

  const { publicKey: newPublicKey, privateKey: newPrivateKey } =
    createES256Key();

  fs.mkdirSync(KEY_ROOT_PATH, { recursive: true });
  fs.writeFileSync(PUBLIC_KEY_PATH, newPublicKey);
  fs.writeFileSync(PRIVATE_KEY_PATH, newPrivateKey);

  publicKey = newPublicKey;
  privateKey = newPrivateKey;
};

export const createES256Key = () => {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
};

export const createJWTToken = (id: string): string => {
  if (!privateKey) {
    throw new Error('Missing JWT private key');
  }

  const payload = { id: id.toString() };

  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    expiresIn: '7 day',
  });
};

export const verifyJWTToken = async (
  token: string,
): Promise<UserDocument | null> => {
  if (!publicKey) {
    throw new Error('Missing JWT public key');
  }

  try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['ES256'],
    });

    if (typeof payload !== 'string') {
      const id = payload.id;

      if (typeof id === 'string') {
        const user = await User.findById(id);
        return user;
      }
    }
  } catch (e) {
    return null;
  }

  return null;
};
