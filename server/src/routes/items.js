import express from "express";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { fetchLinkMetadata, isSafeHttpUrl } from "../lib/linkMetadata.js";
import { currentWeekRange } from "../lib/week.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();
router.use(requireAuth);

const TYPES = ["book", "article", "post", "other"];
const STATUSES = ["unread", "active", "paused", "done", "archived"];
const GOAL_UNITS = ["pages", "minutes", "chapters", "percent"];

router.get(
  "/link-metadata",
  asyncHandler(async (req, res) => {
    const { url } = req.query;
    if (!url || !isSafeHttpUrl(url)) {
      return res.status(400).json({ error: "invalid_url" });
    }
    const metadata = await fetchLinkMetadata(url);
    res.json(metadata);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }

    const params = [req.user.id];
    let sql = "SELECT * FROM items WHERE user_id = $1";
    if (status) {
      params.push(status);
      sql += " AND status = $2";
    } else {
      sql += " AND status != 'archived'";
    }
    sql += " ORDER BY created_at DESC";

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { type, link, source_note, description } = req.body ?? {};
    let title = req.body?.title?.trim() || null;

    if (!TYPES.includes(type)) {
      return res.status(400).json({ error: "invalid_type" });
    }
    if (link && !isSafeHttpUrl(link)) {
      return res.status(400).json({ error: "invalid_link" });
    }

    let estimatedReadTimeMinutes = null;
    if (link && !title) {
      const metadata = await fetchLinkMetadata(link);
      title = metadata.title || link;
      estimatedReadTimeMinutes = metadata.estimatedReadTimeMinutes ?? null;
    }

    if (!title) {
      return res.status(400).json({ error: "title_or_link_required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO items (user_id, title, type, link, source_note, description, estimated_read_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, type, link || null, source_note || null, description || null, estimatedReadTimeMinutes]
    );

    res.status(201).json(rows[0]);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const fields = [];
    const values = [];
    let i = 1;

    if (req.body?.title !== undefined) {
      fields.push(`title = $${i++}`);
      values.push(req.body.title);
    }
    if (req.body?.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(req.body.description || null);
    }
    if (req.body?.type !== undefined) {
      if (!TYPES.includes(req.body.type)) {
        return res.status(400).json({ error: "invalid_type" });
      }
      fields.push(`type = $${i++}`);
      values.push(req.body.type);
    }
    if (req.body?.link !== undefined) {
      if (req.body.link && !isSafeHttpUrl(req.body.link)) {
        return res.status(400).json({ error: "invalid_link" });
      }
      fields.push(`link = $${i++}`);
      values.push(req.body.link || null);
    }
    if (req.body?.source_note !== undefined) {
      fields.push(`source_note = $${i++}`);
      values.push(req.body.source_note);
    }
    if (req.body?.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: "invalid_status" });
      }
      fields.push(`status = $${i++}`);
      values.push(req.body.status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "no_fields_to_update" });
    }

    values.push(req.params.id, req.user.id);
    const { rows } = await pool.query(
      `UPDATE items SET ${fields.join(", ")} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "item_not_found" });
    }

    res.json(rows[0]);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "item_not_found" });
    }

    res.status(204).send();
  })
);

router.post(
  "/:id/goal",
  asyncHandler(async (req, res) => {
    const { goal_unit, target_date } = req.body ?? {};

    if (!GOAL_UNITS.includes(goal_unit)) {
      return res.status(400).json({ error: "invalid_goal_unit" });
    }
    const goalValue = Number(req.body?.goal_value);
    if (!Number.isFinite(goalValue) || goalValue <= 0) {
      return res.status(400).json({ error: "invalid_goal_value" });
    }
    const daysPerWeek = Number(req.body?.days_per_week);
    if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
      return res.status(400).json({ error: "invalid_days_per_week" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: itemRows } = await client.query(
        "SELECT id FROM items WHERE id = $1 AND user_id = $2",
        [req.params.id, req.user.id]
      );
      if (itemRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "item_not_found" });
      }

      const { rows: goalRows } = await client.query(
        `INSERT INTO goals (item_id, goal_unit, goal_value, days_per_week, target_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (item_id) DO UPDATE SET
           goal_unit = EXCLUDED.goal_unit,
           goal_value = EXCLUDED.goal_value,
           days_per_week = EXCLUDED.days_per_week,
           target_date = EXCLUDED.target_date
         RETURNING *`,
        [req.params.id, goal_unit, goalValue, daysPerWeek, target_date || null]
      );

      await client.query("UPDATE items SET status = 'active' WHERE id = $1", [req.params.id]);

      await client.query("COMMIT");
      res.status(200).json(goalRows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

router.get(
  "/:id/progress",
  asyncHandler(async (req, res) => {
    const { rows: itemRows } = await pool.query("SELECT id FROM items WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.id,
    ]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: "item_not_found" });
    }

    const { rows: goalRows } = await pool.query("SELECT * FROM goals WHERE item_id = $1", [req.params.id]);
    const goal = goalRows[0] ?? null;

    const { weekStart, weekEnd } = currentWeekRange();
    const { rows: checkinRows } = await pool.query(
      "SELECT DISTINCT checkin_date FROM checkins WHERE user_id = $1 AND item_id = $2 AND checkin_date BETWEEN $3 AND $4",
      [req.user.id, req.params.id, weekStart, weekEnd]
    );

    res.json({
      week_start: weekStart,
      week_end: weekEnd,
      days_completed: checkinRows.length,
      days_per_week: goal?.days_per_week ?? null,
      goal,
    });
  })
);

export default router;
