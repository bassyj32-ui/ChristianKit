/**
 * VAPID Key Management Utility
 * Centralized handling of VAPID keys for push notifications
 */

export interface VapidKeys {
  publicKey: string;
  privateKey?: string; // Only available on server-side
}

/**
 * Get VAPID keys from environment variables
 */
export function getVapidKeys(): VapidKeys {
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = import.meta.env.VITE_VAPID_PRIVATE_KEY; // Server-side only

  return {
    publicKey: publicKey || '',
    privateKey: privateKey
  };
}

/**
 * Validate VAPID public key format
 * VAPID keys should be base64url encoded and specific length
 */
export function validateVapidPublicKey(publicKey: string): boolean {
  if (!publicKey || typeof publicKey !== 'string') {
    return false;
  }

  // VAPID public keys are typically 65 bytes (87 base64url characters)
  // Remove any padding and check basic format
  const cleanKey = publicKey.replace(/=/g, '');

  // Should be base64url format (A-Z, a-z, 0-9, -, _)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;

  return cleanKey.length >= 80 && cleanKey.length <= 90 && base64UrlRegex.test(cleanKey);
}

/**
 * Get validated VAPID public key with error handling
 */
export function getValidatedVapidPublicKey(): string {
  const { publicKey } = getVapidKeys();

  if (!validateVapidPublicKey(publicKey)) {
    console.error('❌ Invalid or missing VAPID public key. Please check your environment configuration.');
    console.error('Expected format: base64url string (typically 87 characters)');
    console.error('Current value:', publicKey ? `${publicKey.substring(0, 20)}...` : 'undefined');

    // Instead of throwing, return empty string to prevent crashes
    // The calling code should handle this gracefully
    return '';
  }

  return publicKey;
}

/**
 * Check if VAPID keys are properly configured
 */
export function areVapidKeysConfigured(): boolean {
  const { publicKey } = getVapidKeys();
  return validateVapidPublicKey(publicKey);
}

/**
 * Log VAPID key configuration status for debugging
 */
export function logVapidConfigurationStatus(): void {
  const configured = areVapidKeysConfigured();
  const { publicKey } = getVapidKeys();

  if (configured) {
    console.log('✅ VAPID keys properly configured');
    console.log(`🔑 Public key length: ${publicKey.length} characters`);
  } else {
    console.warn('⚠️ VAPID keys not properly configured');
    console.warn('Push notifications will not work without valid VAPID keys');
    console.warn('Please set VITE_VAPID_PUBLIC_KEY in your environment variables');
  }
}


