import { newSeed } from '@mise/engine';
import * as Crypto from 'expo-crypto';

export function mintSeed(): string {
  return newSeed((n) => Crypto.getRandomBytes(n));
}

export function mintId(): string {
  return Crypto.randomUUID();
}
