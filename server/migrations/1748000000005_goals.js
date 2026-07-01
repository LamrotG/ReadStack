export const up = (pgm) => {
  pgm.createTable("goals", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    item_id: { type: "uuid", notNull: true, unique: true, references: "items", onDelete: "CASCADE" },
    goal_unit: {
      type: "text",
      notNull: true,
      check: "goal_unit IN ('pages', 'minutes', 'chapters', 'percent')",
    },
    goal_value: { type: "numeric", notNull: true },
    days_per_week: { type: "int", notNull: true },
    target_date: { type: "date" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
};

export const down = (pgm) => {
  pgm.dropTable("goals");
};
