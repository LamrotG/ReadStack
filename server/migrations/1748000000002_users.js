export const up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    email: { type: "text", notNull: true, unique: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    overall_goal_days_per_week: { type: "int" },
  });
};

export const down = (pgm) => {
  pgm.dropTable("users");
};
