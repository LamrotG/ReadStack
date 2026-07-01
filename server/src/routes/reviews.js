import express from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// POST /api/items/:id/reviews — requires auth; also transitions item to done
router.post(
  "/:id/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { body, visibility = "private" } = req.body ?? {};

    if (!body || typeof body !== "string" || body.trim() === "") {
      return res.status(400).json({ error: "body_required" });
    }
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "invalid_visibility" });
    }

    // Verify item belongs to user
    const { rows: itemRows } = await pool.query("SELECT id FROM items WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.id,
    ]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: "item_not_found" });
    }

    const { rows } = await pool.query(
      "INSERT INTO reviews (item_id, user_id, body, visibility) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.params.id, req.user.id, body.trim(), visibility]
    );

    // Transition item to done
    await pool.query("UPDATE items SET status = 'done' WHERE id = $1", [req.params.id]);

    res.status(201).json(rows[0]);
  })
);

// GET /api/items/:id/reviews — public reviews (no auth required, for future thread feature)
router.get(
  "/:id/reviews",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM reviews WHERE item_id = $1 AND visibility = 'public' ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  })
);

export default router;
