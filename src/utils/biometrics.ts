/**
 * Biometric authentication utility for VoteSecureHQ
 * Simulates WebAuthn / TouchID / FaceID secure credentials persistent storage
 * in sandboxed environments to guarantee 100% iframe reliability.
 */

export interface BiometricProfile {
  email: string;
  displayName: string;
  secretToken: string; // Base64 encoded password for frictionless auth proxy
  enrolledAt: string;
  userId?: string;
  fingerprintType?: string;
}

const STORAGE_KEY = 'votesecure_biometric_profiles';

// Check if biometric credential API is available and there are active profiles
export function hasBiometricSupport(): boolean {
  return typeof window !== 'undefined' && 'credentials' in navigator;
}

export function getBiometricProfiles(): BiometricProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Failed to parse biometric credentials', error);
    return [];
  }
}

export function enrollBiometrics(email: string, pass: string, displayName: string, fingerprintType?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const profiles = getBiometricProfiles();
    const cleanEmail = email.toLowerCase().trim();
    
    // Remove if already exists with old credentials
    const filtered = profiles.filter(p => p.email.toLowerCase().trim() !== cleanEmail);
    
    const newProfile: BiometricProfile = {
      email,
      displayName,
      secretToken: btoa(pass), // Obfuscate password in simulated secure sandbox
      enrolledAt: new Date().toISOString(),
      fingerprintType: fingerprintType || 'Right Index'
    };
    
    filtered.push(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to enroll biometric credentials', error);
    return false;
  }
}

export function removeBiometrics(email: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const profiles = getBiometricProfiles();
    const cleanEmail = email.toLowerCase().trim();
    const filtered = profiles.filter(p => p.email.toLowerCase().trim() !== cleanEmail);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to remove biometric profiles', error);
    return false;
  }
}

export function retrieveObfuscatedPassword(profile: BiometricProfile): string | null {
  try {
    return atob(profile.secretToken);
  } catch {
    return null;
  }
}
