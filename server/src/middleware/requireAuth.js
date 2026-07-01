import { SESSION_COOKIE, verifySession } from "../lib/session.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  try {
    req.user = verifySession(token);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_session" });
  }
}
