export const up = (pgm) => {
  pgm.createTable("checkins", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "CASCADE" },
    item_id: { type: "uuid", references: "items", onDelete: "CASCADE" },
    checkin_date: { type: "date", notNull: true },
    note: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  // NULL item_id rows are not subject to uniqueness (Postgres treats NULLs as
  // distinct), matching the spec's "general sessions are not constrained" rule.
  pgm.addConstraint("checkins", "checkins_user_item_date_unique", {
    unique: ["user_id", "item_id", "checkin_date"],
  });

  pgm.createIndex("checkins", ["user_id", "checkin_date"]);
};

export const down = (pgm) => {
  pgm.dropTable("checkins");
};
