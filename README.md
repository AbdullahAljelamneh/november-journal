# The November Journal

A personal habit tracker for November 2026, titled **Get ready for engagement in one month**.

## Use

- **Daily planner:** select any November date using the date strip or shortcut, check six daily habits, add tasks with optional times, and write a note.
- **Habit calendar:** see all 180 habit checkboxes and update any day directly.
- **Monthly goals:** choose Quran, Job applications, or Salsey to see its progress and update its details. Only one goal is shown at a time. Optional pilot notes and the December review expand when needed.
- **Back up / Restore:** export progress as JSON or restore a previously exported file. Restore asks before replacing current entries.

The daily habits are Quran memorization review, Knock the door, ten minutes of English reading, ten minutes of religious reading, ten Quran pages, and one Salsey action. Quran chapters are editable because the exact passages have not yet been specified.

Job applications use four checkpoints: Nov 1–7, 8–14, 15–21, and 22–30, each targeting five. This preserves the requested total of twenty.

The Salsey goal is a pilot launch and first-week evidence by November 30. Its existing plan calls for a dry run in the week of November 16, a November 23 launch, a December 18 pilot end, and a December 21–24 review. November is an early checkpoint, not a forced final verdict.

## Privacy and storage

Entries are stored only in this browser's `localStorage`. There is no account system, analytics, database, or cross-device synchronization. Different domains and browser profiles have separate data. Clearing browser data can erase progress: export a backup regularly and before changing devices or hosting domains. Other people with access to the same browser profile can see its entries.

The deployed page and this source repository may be publicly accessible. Your entered tasks, notes, and progress are not sent to Render or GitHub. Google Fonts is used for optional typography, with system fallbacks. Quran and hadith source links open their original websites.

## Run locally

From this folder:

```sh
python -m http.server 4173 --directory dist --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. No dependencies or build step are needed.

## Deploy to Render

Create a **Static Site** from the repository. Select branch `main`, build command `echo "Static journal ready"`, and publish directory `dist`. The included `render.yaml` also defines these settings.

Static hosting is free within Render's workspace usage allowances; see https://render.com/docs/static-sites and https://render.com/pricing. There is no paid database or web service in this project.

## Daily words

`dist/quotes.js` includes thirty Arabic entries: ten short Quran excerpts, five hadith excerpts, and fifteen original reflections clearly identified as reflections. The card uses right-to-left layout and Arabic source labels; references link to Quran.com and Sunnah.com. Quran and hadith text uses the original Arabic. The rest of the journal is in English.

## Files

- `dist/index.html`: page shell
- `dist/styles.css`: responsive journal design
- `dist/app.js`: interactions and local persistence
- `dist/quotes.js`: daily excerpts and reflections
- `render.yaml`: optional Render Blueprint

The tracker is deliberately limited to November 2026. It does not schedule notifications or run background jobs.
