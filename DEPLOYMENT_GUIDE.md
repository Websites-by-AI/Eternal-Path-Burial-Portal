# Cloudflare Deployment Guide

To fix the deployment error and host your app for free, please follow these steps in your Cloudflare Dashboard:

## 1. Set the Build & Deploy Configuration
The error `Infinite loop detected` was caused by the legacy `/* / 200` rewrite in the `_redirects` file. We have migrated the application to use Cloudflare's new native Worker Assets SPA routing by setting `"not_found_handling": "single-page-application"` inside `wrangler.json` and removing the error-prone `_redirects` file entirely!

The error `Missing Pages project name` happens if Cloudflare tries to run a Pages-specific deployment command (`npx wrangler pages deploy`) on a Wrangler Worker project.

To fix both errors, configure your build settings exactly like this in your **Cloudflare Dashboard**:

1. Go to your **Cloudflare Dashboard**.
2. Select your Worker project: `eternal-path-burial-portal`.
3. Go to **Settings** -> **Build & Deploy** (Build configuration).
4. Click **Edit** on your build configuration.
5. Set the values to:
   - **Root directory**: `/` (Or leave empty)
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy` *(Ensure it is not 'pages deploy')*
   - **Build output directory**: `dist`
6. Click **Save**.
7. Go to **Deployments** and click **Retry Deployment** (or trigger a new build by pushing/merging a commit).

## 2. Using Firebase (Free Tier)
This app uses **Firebase Firestore** which has a generous free tier. 
- Ensure you have set your Firebase environment variables in your Cloudflare Dashboard's **Variables/Secrets** section:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

## 3. Uploading Data
I have added a comprehensive guide to the **Staff Portal** (Admin Page).
- You can now use **Smart AI Upload** (拍照) to extract data from tombstone photos.
- Or use **Bulk Upload (CSV)** to migrate paper records.
- Download the **Unicode Template** directly from the portal to ensure correct formatting for Persian characters.
