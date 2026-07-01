import bcrypt from "bcrypt";
import crypto from "node:crypto";
import express from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { clearSessionCookie, setSessionCookie, signSession } from "../lib/session.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
const SALT_ROUNDS  = 12;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE  = /^[a-z0-9_]{3,20}$/;
const PW_MIN       = 8;

// ── helpers ──────────────────────────────────────────────────────────────────

function fullUser(row) {
  return {
    id:                      row.id,
    email:                   row.email,
    username:                row.username,
    display_name:            row.display_name,
    avatar_seed:             row.avatar_seed,
    theme_preference:        row.theme_preference ?? "dark",
    overall_goal_days_per_week: row.overall_goal_days_per_week,
    onboarding_complete:     !!row.username,
  };
}

async function issueSession(res, user) {
  setSessionCookie(res, signSession({ id: user.id, email: user.email }));
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const email    = String(req.body?.email    || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "invalid_email" });
    }
    if (password.length < PW_MIN) {
      return res.status(400).json({ error: "password_too_short", min: PW_MIN });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "email_taken" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email, hash]
    );

    await issueSession(res, rows[0]);
    res.status(201).json({ status: "ok", user: fullUser(rows[0]) });
  })
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    // Accept either "identifier" (new) or legacy "username" field
    const identifier = String(req.body?.identifier || req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!identifier || !password) {
      return res.status(400).json({ error: "missing_credentials" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [identifier]
    );
    const user = rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    await issueSession(res, user);
    res.json({ status: "ok", user: fullUser(user) });
  })
);

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "invalid_email" });
    }

    const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    // Always respond OK to not leak whether email is registered
    if (rows.length === 0) {
      return res.json({ status: "ok" });
    }

    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await pool.query(
      "INSERT INTO auth_tokens (user_id, email, token, expires_at) VALUES ($1, $2, $3, $4)",
      [rows[0].id, email, token, expiresAt]
    );

    const link = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, link);

    res.json({ status: "ok" });
  })
);

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const token    = String(req.body?.token    || "");
    const password = String(req.body?.password || "");

    if (!token) return res.status(400).json({ error: "missing_token" });
    if (password.length < PW_MIN) {
      return res.status(400).json({ error: "password_too_short", min: PW_MIN });
    }

    const { rows } = await pool.query("SELECT * FROM auth_tokens WHERE token = $1", [token]);
    const rec = rows[0];

    if (!rec)          return res.status(404).json({ error: "invalid_token" });
    if (rec.used_at)   return res.status(400).json({ error: "token_already_used" });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ error: "token_expired" });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, rec.user_id]);
    await pool.query("UPDATE auth_tokens SET used_at = now() WHERE id = $1", [rec.id]);

    res.json({ status: "ok" });
  })
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "user_not_found" });
    res.json({ user: fullUser(rows[0]) });
  })
);

// ── PATCH /api/auth/profile ───────────────────────────────────────────────────
router.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { username, display_name, avatar_seed, theme_preference } = req.body ?? {};

    if (username !== undefined) {
      if (!USERNAME_RE.test(username)) {
        return res.status(400).json({
          error: "invalid_username",
          message: "Username must be 3–20 characters: lowercase letters, numbers, underscores.",
        });
      }
      const clash = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, req.user.id]
      );
      if (clash.rows.length > 0) {
        return res.status(409).json({ error: "username_taken" });
      }
    }

    if (theme_preference !== undefined && !["dark", "light"].includes(theme_preference)) {
      return res.status(400).json({ error: "invalid_theme_preference" });
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET username         = COALESCE($1, username),
           display_name     = COALESCE($2, display_name),
           avatar_seed      = COALESCE($3, avatar_seed),
           theme_preference = COALESCE($4, theme_preference)
       WHERE id = $5
       RETURNING *`,
      [username ?? null, display_name ?? null, avatar_seed ?? null, theme_preference ?? null, req.user.id]
    );

    res.json({ user: fullUser(rows[0]) });
  })
);

// ── PATCH /api/auth/password ──────────────────────────────────────────────────
router.patch(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = String(req.body?.current_password || "");
    const newPassword     = String(req.body?.new_password     || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "missing_fields" });
    }
    if (newPassword.length < PW_MIN) {
      return res.status(400).json({ error: "password_too_short", min: PW_MIN });
    }

    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0]?.password_hash) {
      return res.status(400).json({ error: "no_password_set" });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: "wrong_current_password" });
    }

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);

    res.json({ status: "ok" });
  })
);

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ status: "ok" });
});

export default router;
