import { env } from '../config/env.js';

const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';

const isSecureCookie = env.nodeEnv === 'production';

function parseMaxAge(expiresIn, fallbackMs) {
  if (typeof expiresIn !== 'string') {
    return fallbackMs;
  }

  const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return fallbackMs;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 's') return value * 1000;
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;

  return fallbackMs;
}

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx <= 0) {
        return acc;
      }
      const key = pair.slice(0, idx).trim();
      const value = decodeURIComponent(pair.slice(idx + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

export function getAccessTokenFromCookies(req) {
  return parseCookieHeader(req?.headers?.cookie)[ACCESS_COOKIE_NAME] ?? null;
}

export function getRefreshTokenFromCookies(req) {
  return parseCookieHeader(req?.headers?.cookie)[REFRESH_COOKIE_NAME] ?? null;
}

export function setAuthCookies(res, accessToken, refreshToken) {
  setAccessCookie(res, accessToken);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: parseMaxAge(env.jwtRefreshExpiresIn, 7 * 24 * 60 * 60 * 1000)
  });
}

export function setAccessCookie(res, accessToken) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: parseMaxAge(env.jwtExpiresIn, 15 * 60 * 1000)
  });
}

export function clearAuthCookies(res) {
  const baseOptions = {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/'
  };

  res.clearCookie(ACCESS_COOKIE_NAME, baseOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseOptions,
    sameSite: 'strict',
    path: '/api/auth'
  });
}
