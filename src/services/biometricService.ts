/**
 * Biometric Service
 *
 * WebAuthn wrapper for platform authenticators (Touch ID, Face ID, Windows Hello).
 * Local-only authentication — no server-side verification needed.
 */

const RP_NAME = 'LiquidOS';

function getRpId(): string {
  return window.location.hostname;
}

// ============================================================================
// Feature Detection
// ============================================================================

export function isBiometricSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ============================================================================
// Helpers
// ============================================================================

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function getUserId(): Uint8Array {
  const stored = localStorage.getItem('liquid-webauthn-user-id');
  if (stored) {
    return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  }
  const id = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem('liquid-webauthn-user-id', btoa(String.fromCharCode(...id)));
  return id;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

// ============================================================================
// Registration
// ============================================================================

export interface RegisterResult {
  credentialId: string;
  publicKey: string;
}

export async function registerBiometric(): Promise<RegisterResult> {
  if (!isBiometricSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: generateChallenge(),
      rp: { name: RP_NAME, id: getRpId() },
      user: {
        id: getUserId(),
        name: 'liquidos-user',
        displayName: 'LiquidOS User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Credential creation was cancelled');
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  const publicKeyBuffer = response.getPublicKey?.() ?? new ArrayBuffer(0);

  return {
    credentialId: bufferToBase64url(credential.rawId),
    publicKey: bufferToBase64url(publicKeyBuffer),
  };
}

// ============================================================================
// Authentication
// ============================================================================

export async function authenticateBiometric(
  allowedCredentialIds: string[]
): Promise<boolean> {
  if (!isBiometricSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const allowCredentials: PublicKeyCredentialDescriptor[] = allowedCredentialIds.map((id) => ({
    id: base64urlToBuffer(id),
    type: 'public-key',
    transports: ['internal'],
  }));

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: generateChallenge(),
        rpId: getRpId(),
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return assertion !== null;
  } catch {
    return false;
  }
}
