export const up = (pgm) => {
  pgm.createTable("reviews", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    item_id: { type: "uuid", notNull: true, references: "items", onDelete: "CASCADE" },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "CASCADE" },
    body: { type: "text", notNull: true },
    visibility: {
      type: "text",
      notNull: true,
      default: "private",
      check: "visibility IN ('public', 'private')",
    },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("reviews", "item_id");
};

export const down = (pgm) => {
  pgm.dropTable("reviews");
};
