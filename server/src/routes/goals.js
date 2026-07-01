import express from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

router.get(
  "/overall",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT overall_goal_days_per_week FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ overall_goal_days_per_week: rows[0]?.overall_goal_days_per_week ?? null });
  })
);

router.patch(
  "/overall",
  asyncHandler(async (req, res) => {
    const value = req.body?.overall_goal_days_per_week;
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 7)) {
      return res.status(400).json({ error: "invalid_overall_goal_days_per_week" });
    }

    const { rows } = await pool.query(
      "UPDATE users SET overall_goal_days_per_week = $1 WHERE id = $2 RETURNING overall_goal_days_per_week",
      [value, req.user.id]
    );

    res.json({ overall_goal_days_per_week: rows[0].overall_goal_days_per_week });
  })
);

export default router;
