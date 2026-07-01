export const up = (pgm) => {
  pgm.createTable("auth_tokens", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" },
    email: { type: "text", notNull: true },
    token: { type: "text", notNull: true, unique: true },
    expires_at: { type: "timestamptz", notNull: true },
    used_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("auth_tokens", "email");
};

export const down = (pgm) => {
  pgm.dropTable("auth_tokens");
};
