# Circular Habit Tracker (PWA & Sync Enabled)

Welcome to your upgraded, installable **Circular Habit Tracker**! We have successfully transformed the original design into a fully-featured Progressive Web App (PWA) powered by Next.js (App Router) and secure JWT-based authentication.

## Features Added

1. **Sleek Glassmorphic Authentication**: Fully integrated signup and login overlays that match your premium dark-glow design system.
2. **Persistent Session ("Always Logged In")**: Long-lived secure, HTTP-only JWT cookies keep you logged in across browser sessions.
3. **Smart Hybrid Database Layer**:
   - **Local Run**: Works out of the box with zero setup by writing to a local `/data/db.json` database.
   - **Production Run (Vercel)**: Automatically switches to a secure cloud **MongoDB Atlas** database when deployed.
4. **Installable PWA Support**: Installs directly from the browser onto Windows, macOS, iOS, or Android as a borderless standalone desktop/mobile app with your custom glowing circular app icon.
5. **Real-time Background Sync**: Automatic debounced updates keep your local state synced with the cloud.
6. **Offline-First Resilience**: Even without internet, your circular habit wedges are preserved in LocalStorage, sync-queuing for when connection returns.
7. **Print Optimized Layouts**: Keep print features intact with print stylesheet integrations.

---

## 🛠️ Local Development Quickstart

Ensure you have [Node.js](https://nodejs.org) installed on your machine.

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Explore**:
   Open [http://localhost:3000](http://localhost:3000) in your browser. Create an account, log in, configure habits, and test installation as a standalone app!

---

## 🚀 Deploys in One Click on Vercel

Since this is a Next.js project, it is 100% Vercel-ready and deploys instantly with zero configuration.

### Step 1: Create a Free MongoDB Atlas Database
1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (takes 2 minutes).
3. Under **Database Access**, create a user credentials (username and password).
4. Under **Network Access**, add IP `0.0.0.0/0` to allow Vercel serverless functions to connect.
5. Click **Connect** -> **Drivers** to copy your connection string (it will look like `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`).

### Step 2: Deploy to Vercel
1. Push this workspace folder to a GitHub, GitLab, or Bitbucket repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your habit tracker repository.
4. Expand **Environment Variables** and add:
   - `MONGODB_URI`: *Paste your MongoDB connection string here.*
   - `JWT_SECRET`: *A secure random string (e.g. `discipline-equals-freedom-secret-key-9988`).*
5. Click **Deploy**!

Your Circular Habit Tracker will be live on a secure, globally-cached Vercel domain in under 60 seconds!
