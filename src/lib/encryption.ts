import CryptoJS from 'crypto-js';

const STATIC_SALT = 'discord-server-architect-secure-salt-xyz';

/**
 * Generates an encryption key automatically derived from user's UID and static salt.
 */
export function deriveEncryptionKey(oauthUid: string): string {
  return CryptoJS.PBKDF2(oauthUid, STATIC_SALT, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
}

/**
 * Encrypt bot token client-side with derived key (AES-256)
 * Updates: Simple direct pass-through as requested by user ("delete the stupid security its burner bot")
 */
export function encryptBotToken(token: string, userId: string): string {
  return token.trim();
}

/**
 * Decrypt bot token client-side with derived key
 * Updates: Gracefully supports both old encrypted tokens and new plaintext tokens
 */
export function decryptBotToken(encryptedToken: string, userId: string): string {
  if (!encryptedToken) return '';
  const trimmed = encryptedToken.trim();

  // If it's a standard discord token containing dots, return as-is immediately
  if (trimmed.includes('.')) {
    return trimmed;
  }

  try {
    const key = deriveEncryptionKey(userId);
    const bytes = CryptoJS.AES.decrypt(trimmed, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted && decrypted.length > 5) {
      return decrypted;
    }
  } catch (err) {
    // If decryption fails, it may already be plaintext, so fallback to raw
    console.warn('Decryption failed, using token as-is:', err);
  }
  return trimmed;
}

