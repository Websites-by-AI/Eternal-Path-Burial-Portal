# Cloudflare Deployment Guide

To fix the deployment error and host your app for free, please follow these steps in your Cloudflare Dashboard:

## 1. Set the Build Command
The error `dist directory does not exist` happens because Cloudflare is trying to upload the app without building it first.

1. Go to your **Cloudflare Dashboard**.
2. Select your Worker/Pages project: `eternal-path-burial-portal`.
3. Go to **Settings** -> **Build & Deploy**.
4. Click **Edit** on the build configuration.
5. Set:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save**.
7. Go to **Deployments** and click **Retry Deployment**.

## 2. Using Firebase (Free Tier)
This app uses **Firebase Firestore** which has a generous free tier. 
- Ensure you have set your Firebase environment variables in the Cloudflare Dashboard:
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
