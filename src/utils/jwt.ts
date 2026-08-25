import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { SignOptions } from 'jsonwebtoken';

export type JwtPayload = {
  sub: string;
  email: string;
};

export const signAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};