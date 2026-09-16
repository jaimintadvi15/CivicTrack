import { CivicIssue } from '../types';

/**
 * Strips all non-digit characters from a phone number.
 */
export const cleanPhone = (phone?: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').trim();
};

/**
 * Normalizes phone numbers to standard 10-digit format (omitting country code prefixes like +91 / 0)
 */
export const normalizePhone = (phone?: string | null): string => {
  const digits = cleanPhone(phone);
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/**
 * Robust check if a listing belongs to the current user.
 * Evaluates:
 * 1. Matching user ID (e.g. user-9876543210 or Firebase Auth UID)
 * 2. Matching Firebase Auth UID
 * 3. Matching normalized 10-digit phone number (fallback across sessions, relogins, or legacy IDs)
 */
export const isListingOwner = (
  issue: CivicIssue,
  currentUser?: { id?: string; phone?: string } | null,
  authUid?: string | null
): boolean => {
  if (!issue || (!currentUser && !authUid)) return false;

  const currentId = currentUser?.id;
  const currentPhone = normalizePhone(currentUser?.phone);
  const issueReporterPhone = normalizePhone(issue.reporterPhone);

  // 1. Direct ID match (e.g., user-9876543210 or UID)
  if (currentId && issue.citizenId === currentId) {
    return true;
  }

  // 2. Firebase Auth UID match
  if (authUid && issue.citizenId === authUid) {
    return true;
  }

  // 3. Normalized Phone match fallback (handles relogin across different sessions or legacy IDs)
  if (currentPhone && issueReporterPhone && currentPhone === issueReporterPhone) {
    return true;
  }

  return false;
};
