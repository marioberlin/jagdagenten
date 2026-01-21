/**
 * Cookie utilities for iCloud API
 */

import type { Cookie } from '../types/session';

/**
 * Parse a Set-Cookie header string into a Cookie object
 */
export function parseCookie(cookieString: string): Cookie | null {
  const parts = cookieString.split(';').map(p => p.trim());
  if (parts.length === 0) return null;

  // First part is name=value
  const [nameValue, ...attributes] = parts;
  const equalIndex = nameValue.indexOf('=');
  if (equalIndex === -1) return null;

  const name = nameValue.substring(0, equalIndex);
  const value = nameValue.substring(equalIndex + 1);

  const cookie: Cookie = {
    name,
    value,
    domain: '',
    path: '/',
  };

  // Parse attributes
  for (const attr of attributes) {
    const [attrName, attrValue] = attr.split('=').map(s => s.trim());
    const attrNameLower = attrName.toLowerCase();

    switch (attrNameLower) {
      case 'domain':
        cookie.domain = attrValue || '';
        break;
      case 'path':
        cookie.path = attrValue || '/';
        break;
      case 'expires':
        cookie.expires = new Date(attrValue);
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'secure':
        cookie.secure = true;
        break;
    }
  }

  return cookie;
}

/**
 * Parse multiple Set-Cookie headers
 */
export function parseCookies(headers: Record<string, string | string[]>): Cookie[] {
  const cookies: Cookie[] = [];
  const setCookieHeader = headers['set-cookie'] || headers['Set-Cookie'];

  if (!setCookieHeader) return cookies;

  const cookieStrings = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const cookieString of cookieStrings) {
    const cookie = parseCookie(cookieString);
    if (cookie) {
      cookies.push(cookie);
    }
  }

  return cookies;
}

/**
 * Convert cookies array to Cookie header string
 */
export function cookiesToString(cookies: Cookie[]): string {
  return cookies
    .filter(c => !isExpired(c))
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
}

/**
 * Merge new cookies into existing cookies array
 * New cookies override existing ones with the same name and domain
 */
export function mergeCookies(existing: Cookie[], newCookies: Cookie[]): Cookie[] {
  const cookieMap = new Map<string, Cookie>();

  // Add existing cookies
  for (const cookie of existing) {
    const key = `${cookie.domain}:${cookie.path}:${cookie.name}`;
    cookieMap.set(key, cookie);
  }

  // Override with new cookies
  for (const cookie of newCookies) {
    const key = `${cookie.domain}:${cookie.path}:${cookie.name}`;
    cookieMap.set(key, cookie);
  }

  return Array.from(cookieMap.values());
}

/**
 * Check if a cookie is expired
 */
export function isExpired(cookie: Cookie): boolean {
  if (!cookie.expires) return false;
  return cookie.expires.getTime() < Date.now();
}

/**
 * Filter cookies for a specific domain
 */
export function getCookiesForDomain(cookies: Cookie[], domain: string): Cookie[] {
  return cookies.filter(cookie => {
    if (!cookie.domain) return true;

    // Exact match
    if (cookie.domain === domain) return true;

    // Domain cookie (starts with dot or subdomain match)
    const cookieDomain = cookie.domain.startsWith('.')
      ? cookie.domain
      : `.${cookie.domain}`;

    return domain.endsWith(cookieDomain) || `.${domain}` === cookieDomain;
  });
}

/**
 * Filter cookies for a specific path
 */
export function getCookiesForPath(cookies: Cookie[], path: string): Cookie[] {
  return cookies.filter(cookie => {
    if (!cookie.path || cookie.path === '/') return true;
    return path.startsWith(cookie.path);
  });
}

/**
 * Get cookies for a URL
 */
export function getCookiesForUrl(cookies: Cookie[], url: string): Cookie[] {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;
  const path = parsedUrl.pathname;

  return getCookiesForPath(
    getCookiesForDomain(cookies, domain),
    path
  ).filter(c => !isExpired(c));
}

/**
 * Serialize a cookie to Set-Cookie format
 */
export function serializeCookie(cookie: Cookie): string {
  let result = `${cookie.name}=${cookie.value}`;

  if (cookie.domain) {
    result += `; Domain=${cookie.domain}`;
  }

  if (cookie.path) {
    result += `; Path=${cookie.path}`;
  }

  if (cookie.expires) {
    result += `; Expires=${cookie.expires.toUTCString()}`;
  }

  if (cookie.httpOnly) {
    result += '; HttpOnly';
  }

  if (cookie.secure) {
    result += '; Secure';
  }

  return result;
}

/**
 * Extract specific cookie by name
 */
export function getCookieByName(cookies: Cookie[], name: string): Cookie | undefined {
  return cookies.find(c => c.name === name && !isExpired(c));
}

/**
 * Remove expired cookies from array
 */
export function removeExpiredCookies(cookies: Cookie[]): Cookie[] {
  return cookies.filter(c => !isExpired(c));
}

/**
 * Convert cookies to a simple key-value object
 */
export function cookiesToObject(cookies: Cookie[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const cookie of cookies) {
    if (!isExpired(cookie)) {
      result[cookie.name] = cookie.value;
    }
  }
  return result;
}
