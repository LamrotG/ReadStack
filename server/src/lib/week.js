function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

// Weeks are Monday-Sunday (ISO), independent of server locale.
export function currentWeekRange() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { weekStart: toDateString(monday), weekEnd: toDateString(sunday) };
}
