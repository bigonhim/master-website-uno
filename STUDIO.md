# The Studio

The Studio is where the site is edited: `/studio` on the site itself. It is part of this codebase, not a separate product. Django holds the content and the rules (`backend/apps/studio`, `media`, `sitecontent`), and Next.js draws the editor (`frontend/app/studio`) with the site's own components.

## What it edits

| Area | What changes there | Where it shows |
| --- | --- | --- |
| **Home page → Hero slides** | The photos behind the call, their order, place tags, and what stays in view on phones and on wide screens | Top of the home page |
| **Home page → Galleries** | Sets of photos with a heading. One is on the home page at a time; the next can be prepared first | Blue recognition band |
| **Words & contact** | The home page's words, section by section, and the phone numbers, WhatsApp, email and address | Home page, footer, contact page |
| **Archive** | Teachings, prophecies, healings, writings: text, videos, dates, nations, publish, schedule | The archive pages |
| **Photos** | The photo library: upload, describe, set the focal point, see where each is used | Everywhere photos appear |
| **Videos** | YouTube videos, added by pasting a link | Archive items |
| **History** | Every change, by whom and when, with restore | — |

Links, icons and layout are deliberately not editable. The Studio edits what the site says and shows; the design stays as designed.

## How it behaves

- **Saving publishes.** Each save refreshes the site's cache for what changed, so the public page shows the change on its next view. New archive items are the exception: they stay drafts until someone presses **Publish**. Saving an item that is already published updates its live page.
- **Live preview.** Home page editors show the change as you type, drawn by the site's own components at phone or desktop width.
- **Drafts can be previewed** in the real site layout (`/preview/<id>`), visible only to signed-in editors.
- **Scheduling.** Give an archive item a future date and publish it; it appears within a few minutes of that time, as the site's cache refreshes.
- **Nothing is lost.** Every save is kept. Any earlier version can be restored, and restoring is itself saved.
- **No silent overwrites.** If two people edit the same thing, the second save is refused with the newer version shown.
- **Safe deletes.** A photo or video in use can't be deleted; the Studio lists where it is used.
- **Dead videos.** An item that plays a video deleted on YouTube can't be published.
- **Photos are prepared on upload.** They are turned upright, resized to 2,560px, saved as high-quality WebP, and stripped of location and camera data. Uploading the same photo twice keeps one copy.
- **Built-in fallback.** Until the Studio has slides or a gallery, and if the API is ever unreachable, the site shows its built-in photos and words (`frontend/lib/site/`).

## First-time setup

From `backend/`, with the virtualenv active:

```bash
python manage.py migrate
python manage.py seed_site_content   # copies today's hero photos and gallery into the Studio
python manage.py setup_studio        # creates the "Editors" group
python manage.py createsuperuser     # the first account, if there isn't one
```

`seed_site_content` is safe to run again: it only adds what isn't there yet.

## Adding an editor

1. Create the account in the Django admin (`/admin/`), or with `createsuperuser` for someone who should be able to do everything.
2. Run `python manage.py setup_studio --user <username>`. This makes the account staff and puts it in **Editors**.

Editors can do everyday editing but can't delete archive items; superusers can. For finer control, change the group's permissions in the Django admin. The Studio hides whatever an account can't use.

Signed-in sessions are listed in the Django admin under **Studio → Editor sessions**. Delete one to sign that person out.

## Deploying

- **Photos.** Uploads are stored under `backend/media/`. Visitors fetch them from the site's own `/media/` path, which Next.js forwards to Django (`next.config.ts`). In production, Django only serves them if `SERVE_MEDIA=True`. Otherwise the web server in front of Django must serve `/media/`. Back up `backend/media/` with the database.
- **The site must know where Django is:** `API_URL` in the Next.js environment (default `http://127.0.0.1:8000/api/v1`).
- **Behind a reverse proxy,** pass the public host through (`X-Forwarded-Host`, or keep `Host`). The Studio refuses any change whose origin doesn't match the host the browser used, the same rule Next.js applies to server actions.
- **HTTPS in production.** The sign-in cookie is marked secure when `NODE_ENV=production`.
- **Changes made in the Django admin** don't refresh the site's cache instantly. They appear when the cache expires: within five minutes on most pages, and within an hour on an archive item's own page.

## For developers

- The editable words are defined once, in `backend/apps/sitecontent/sections.py`: fields, limits and default wording. The Studio's forms are built from it. After changing a default, run `python manage.py export_site_defaults`. It updates the frontend's fallback copy, and a test fails until you do.
- To make a new kind of content editable, register it in `backend/apps/studio/history.py` so it gets history and restore, and give its viewset the tags of the pages that show it.
- The browser never talks to Django. `frontend/app/api/studio/[...path]/route.ts` relays each request with the editor's token from an httpOnly cookie, and refreshes the cache tags Django names in `X-Studio-Revalidate`.
