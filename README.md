# ReadStack

A to-do list built specifically for reading.

Not a reader, not a social network. You dump the pile, set a pace, and check in when you do the work.

---

## What it is

Most "read later" apps turn into a graveyard of saved links nobody opens again. ReadStack isn't a reading app — it's a to-do app for the reading you actually intend to do. Drop in a book, article, or link, set a goal for it, and track your progress the same way you'd track any task.

## Features

- **Pile-based workflow** — quickly add anything you mean to read with just a title; add a description, type, or link when you have them
- **Link auto-fetch** — paste a link and ReadStack pulls in basic details automatically
- **Goals, your way** — set a plain-text goal ("finish by Friday," "10 pages a day") or use structured pace settings
- **Active / Paused / Done / Archived** — reads move through clear states as you work through them
- **GitHub-style activity graph** — see your reading activity at a glance
- **Streaks** — stay consistent and track your daily streak
- **Search, filter, and tags** — find anything in your pile fast
- **Command palette** (`Cmd/Ctrl+K`) — add and navigate without touching the mouse
- **Account & sessions** — manage your profile and see/revoke active sessions on other devices
- **Light and dark mode** — clean shadows in light mode, crisp borders in dark mode

## Tech stack


- **Frontend:** React
- **Backend:** Node.js 
- **Database:**. PostgreSQL
- **Auth:** Email + password sign-up, username / Email + password sign-in


## Project structure

```
readstack/
├── client/          # Frontend application
├── server/          # Express API server
│   └── src/
│       └── index.js
└── README.md
```

## Roadmap

- [ ] Reminders / weekly digest
- [ ] Export (CSV / Markdown)
- [ ] Mobile app



<p align="center">Built for people who actually want to finish what they start reading.</p>