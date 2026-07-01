export const up = (pgm) => {
  pgm.addColumns("users", {
    username: { type: "text", unique: true },
    display_name: { type: "text" },
    password_hash: { type: "text" },
    avatar_seed: { type: "text" },
    theme_preference: { type: "text", default: "'dark'" },
  });

  pgm.createIndex("users", "username");
};

export const down = (pgm) => {
  pgm.dropColumns("users", ["username", "display_name", "password_hash", "avatar_seed", "theme_preference"]);
};
