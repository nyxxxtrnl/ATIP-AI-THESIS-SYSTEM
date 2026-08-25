# ATIP-AI Authentication UI

This package recreates the supplied ATIP/Empath-AI-style sign-up and sign-in screens as a responsive frontend.

## Files

- `index.html` — page structure and content
- `style.css` — colors, spacing, typography, shapes, responsive layout, and animations
- `script.js` — sign-up/sign-in switching, password visibility, form validation, social button interactions
- `assets/` — extracted visual assets from the supplied images

## Run

Open `index.html` in a browser.

For best results, run a local static server from this folder, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

The frontend is UI-only. The form submit handlers are placeholders for your actual authentication/backend.

The original product name was changed to `ATIP-AI`. The social-login choices are `Facebook`, `Gmail`, and `Discord`.
