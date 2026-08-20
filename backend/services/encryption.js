const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SECRET = process.env.ENCRYPTION_SECRET || 'abcdefghijklmnopqrstuvwxyz123456';
const KEY = crypto.scryptSync(SECRET, 'salt', 32);

function encrypt(text) {
  if (text === null || text === undefined || typeof text !== 'string') {
    return text;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:encryptedContent
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText) {
  if (encryptedText === null || encryptedText === undefined || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  // Format: iv(24 hex chars):authTag(32 hex chars):ciphertext(hex chars)
  const formatRegex = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i;
  if (!formatRegex.test(encryptedText)) {
    return encryptedText; // Unencrypted plaintext fallback
  }

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    return encryptedText;
  }
}

module.exports = { encrypt, decrypt };
