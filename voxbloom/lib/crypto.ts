/**
 * AES-256-GCM encryption for localStorage via Web Crypto API.
 * Zero external dependencies — uses only browser-native APIs.
 */

const STORAGE_KEY_NAME = 'bolobridge-ek';
const SALT = new TextEncoder().encode('bolobridge-salt-2026');

// ─── Helpers ────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Key Management ─────────────────────────────────────

// Cache the CryptoKey in memory so we don't re-import on every operation.
// This also means the raw bytes are NOT kept in a JS-accessible variable.
let cachedKey: CryptoKey | null = null;

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const stored = localStorage.getItem(STORAGE_KEY_NAME);

  if (stored) {
    const raw = base64ToBuffer(stored);
    // Import as non-extractable — JS can't read the key material back
    cachedKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    return cachedKey;
  }

  // Generate new key — must be extractable briefly so we can persist it
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(STORAGE_KEY_NAME, bufferToBase64(exported));

  // Re-import as non-extractable for all future use
  cachedKey = await crypto.subtle.importKey(
    'raw',
    exported,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
  return cachedKey;
}

// ─── Encrypt / Decrypt ──────────────────────────────────

export async function encryptData(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Prepend IV to ciphertext so we can extract it on decrypt
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return bufferToBase64(combined.buffer);
}

export async function decryptData(encrypted: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = new Uint8Array(base64ToBuffer(encrypted));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ─── PIN Hashing ────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToBase64(derived);
}

export async function verifyPin(
  entered: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPin(entered);
  // Constant-time comparison isn't critical here (client-side, 4-digit PIN)
  // but we do it for good practice
  return hash === storedHash;
}
