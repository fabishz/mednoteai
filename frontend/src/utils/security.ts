/**
 * src/utils/security.ts
 * 
 * Security utilities for XSS protection, sanitization, etc.
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Sanitize user input for safety
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and patterns
  const sanitized = input
    .trim()
    .slice(0, 1000) // Limit length
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol

  return escapeHtml(sanitized);
}

/**
 * Generate CSRF token for state-changing requests
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get CSRF token from meta tag
 */
export function getCSRFToken(): string | null {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
}

/**
 * Validate same-origin request (prevent CSRF)
 */
export function isSameOrigin(url: string): boolean {
  const a = document.createElement('a');
  a.href = url;
  return (
    a.hostname === window.location.hostname &&
    a.protocol === window.location.protocol &&
    parseInt(a.port || window.location.port, 10) ===
      parseInt(window.location.port, 10)
  );
}

/**
 * Secure token storage in memory (not localStorage)
 */
export class SecureTokenStorage {
  private tokens: Map<string, string> = new Map();

  setToken(key: string, token: string): void {
    // Only store in memory, not in localStorage
    this.tokens.set(key, token);
  }

  getToken(key: string): string | null {
    return this.tokens.get(key) || null;
  }

  removeToken(key: string): void {
    this.tokens.delete(key);
  }

  clear(): void {
    this.tokens.clear();
  }

  // Also check sessionStorage as fallback
  getPersistedToken(key: string): string | null {
    try {
      return sessionStorage.getItem(`secure_${key}`);
    } catch {
      return null;
    }
  }

  setPersistedToken(key: string, token: string): void {
    try {
      sessionStorage.setItem(`secure_${key}`, token);
    } catch {
      // Failed to set in sessionStorage, use memory only
      this.setToken(key, token);
    }
  }
}

export const secureTokenStorage = new SecureTokenStorage();

/**
 * Hash password client-side before sending (additional security layer)
 * Note: Server should NEVER trust client-side hashing alone
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate nonce for inline scripts
 */
export function generateNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Log security event without exposing sensitive data
 */
export function logSecurityEvent(
  eventType: string,
  context?: Record<string, unknown>
): void {
  const sanitizedContext = context
    ? Object.fromEntries(
        Object.entries(context).map(([key, value]) => {
          // Don't log sensitive fields
          if (
            key.includes('password') ||
            key.includes('token') ||
            key.includes('email')
          ) {
            return [key, '***REDACTED***'];
          }
          return [key, value];
        })
      )
    : undefined;

  console.log(`[SECURITY] ${eventType}`, sanitizedContext);

  // TODO: Send to monitoring service (Sentry, LogRocket)
}

/**
 * Detect potential security issues
 */
export function performSecurityChecks(): void {
  // Check for HTTPS in production
  if (
    import.meta.env.PROD &&
    window.location.protocol !== 'https:' &&
    !window.location.hostname.includes('localhost')
  ) {
    console.warn('WARNING: Application should be served over HTTPS');
  }

  // Check for vulnerable dependencies via console
  if (import.meta.env.DEV) {
    console.info(
      'Development mode: Enable security audits with `npm audit`'
    );
  }
}
