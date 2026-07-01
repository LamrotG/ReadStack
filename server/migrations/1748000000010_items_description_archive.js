export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("items", {
    description: { type: "text" },
  });
  // Expand status CHECK to allow 'archived'
  pgm.sql(`
    ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;
    ALTER TABLE items ADD CONSTRAINT items_status_check
      CHECK (status IN ('unread', 'active', 'paused', 'done', 'archived'));
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    UPDATE items SET status = 'unread' WHERE status = 'archived';
    ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;
    ALTER TABLE items ADD CONSTRAINT items_status_check
      CHECK (status IN ('unread', 'active', 'paused', 'done'));
  `);
  pgm.dropColumn("items", "description");
};
