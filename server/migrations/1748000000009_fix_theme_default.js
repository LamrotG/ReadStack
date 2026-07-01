export const up = (pgm) => {
  pgm.sql("ALTER TABLE users ALTER COLUMN theme_preference SET DEFAULT 'dark'");
};

export const down = (pgm) => {
  pgm.sql("ALTER TABLE users ALTER COLUMN theme_preference DROP DEFAULT");
};
