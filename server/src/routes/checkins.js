import express from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    if (!DATE_RE.test(from || "") || !DATE_RE.test(to || "")) {
      return res.status(400).json({ error: "invalid_date_range" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM checkins WHERE user_id = $1 AND checkin_date BETWEEN $2 AND $3 ORDER BY checkin_date ASC",
      [req.user.id, from, to]
    );
    res.json(rows);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { item_id, note } = req.body ?? {};
    const checkinDate = req.body?.checkin_date;

    if (!DATE_RE.test(checkinDate || "")) {
      return res.status(400).json({ error: "invalid_checkin_date" });
    }

    if (item_id) {
      const { rows } = await pool.query("SELECT id FROM items WHERE id = $1 AND user_id = $2", [
        item_id,
        req.user.id,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "item_not_found" });
      }
    }

    try {
      const { rows } = await pool.query(
        "INSERT INTO checkins (user_id, item_id, checkin_date, note) VALUES ($1, $2, $3, $4) RETURNING *",
        [req.user.id, item_id || null, checkinDate, note || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ error: "already_checked_in" });
      }
      throw err;
    }
  })
);

export default router;
