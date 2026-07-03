import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return process.env.JWT_SECRET;
}

export function signSession(user) {
  return jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: "30d" });
}

export function verifySession(token) {
  const payload = jwt.verify(token, secret());
  return { id: payload.sub, email: payload.email };
}

function cookieOptions() {
  const prod = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure:   prod,
    sameSite: prod ? "none" : "lax",
  };
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_MAX_AGE_MS });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}
