
# Verdant Library – Manual Blobs Setup

If your Netlify account doesn't auto-provision Blobs, set two environment variables
on your site (Site settings → Environment variables):

- `SITE_ID` (or `NETLIFY_SITE_ID`) → your Project ID (Site settings → General → Project information → Project ID)
- `NETLIFY_BLOBS_TOKEN` (or `NETLIFY_TOKEN`) → a Personal Access Token from https://app.netlify.com/user/applications

No code changes needed beyond this folder — functions will pick them up automatically.
Edits and cover fetches will then persist for everyone.

This project also hard-falls back to `data/library.json` to ensure the UI always loads.
