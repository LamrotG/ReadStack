export const up = (pgm) => {
  pgm.createTable("items", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "CASCADE" },
    title: { type: "text", notNull: true },
    type: {
      type: "text",
      notNull: true,
      check: "type IN ('book', 'article', 'post', 'other')",
    },
    link: { type: "text" },
    source_note: { type: "text" },
    status: {
      type: "text",
      notNull: true,
      default: "unread",
      check: "status IN ('unread', 'active', 'paused', 'done')",
    },
    estimated_read_time_minutes: { type: "int" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("items", ["user_id", "status"]);

  pgm.createFunction(
    "set_updated_at",
    [],
    { returns: "trigger", language: "plpgsql" },
    `
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger("items", "items_set_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    level: "ROW",
    function: "set_updated_at",
  });
};

export const down = (pgm) => {
  pgm.dropTrigger("items", "items_set_updated_at");
  pgm.dropFunction("set_updated_at", []);
  pgm.dropTable("items");
};
