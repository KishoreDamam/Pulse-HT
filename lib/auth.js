import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cht_fallback_jwt_secret_key_123';
const COOKIE_NAME = 'cht_session';

/**
 * Sign JWT Token
 */
export function signToken(payload, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : '1d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT Token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Extract User ID from Next.js request cookies
 */
export function getUserIdFromRequest(req) {
  try {
    // Look up in cookie header
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );
    
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    
    const decoded = verifyToken(token);
    return decoded ? decoded.userId : null;
  } catch (err) {
    console.error('Error extracting user from request:', err);
    return null;
  }
}

/**
 * Set Session Cookie on a Next.js Response object
 */
export function setSessionCookie(response, token, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
  const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; Expires=${expires}; ${secure} SameSite=Strict`
  );
}

/**
 * Clear Session Cookie on a Next.js Response object
 */
export function clearSessionCookie(response) {
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`
  );
}
