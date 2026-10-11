import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  return `$scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  if (!storedPassword.startsWith("$scrypt$")) {
    const supplied = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return supplied.length === stored.length && timingSafeEqual(supplied, stored);
  }

  const [, algorithm, saltHex, keyHex] = storedPassword.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex || !/^(?:[a-f\d]{2})+$/i.test(saltHex) || !/^(?:[a-f\d]{2})+$/i.test(keyHex)) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;

  const supplied = await deriveKey(password, salt);
  return timingSafeEqual(supplied, expected);
}
