# iResell - Premium Apple Resale & Repair

This is a premium ecosystem for buying, selling, and repairing Apple products, built with React, Vite, Tailwind CSS, and Firebase.

## How to Run Locally

If you want to run this project on your own computer, follow these steps:

### 1. Download the Code
You can export the project from AI Studio by clicking on **Settings** (gear icon) and selecting **Export to ZIP** or **Push to GitHub**.

### 2. Install Dependencies
Navigate to the project directory in your terminal and run:
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your `GEMINI_API_KEY` and other necessary secrets.

### 4. Configure Firebase
If you haven't already, create a project in the [Firebase Console](https://console.firebase.google.com/).
1. Add a Web App to your project.
2. Copy the configuration object and update `firebase-applet-config.json` in the root of this project.
3. Replace the placeholder values like `remixed-project-id` with your actual Firebase credentials.

### 5. Start the Development Server
Run the following command to start the app:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## Features
- **Premium Apple Store**: Browse and purchase certified pre-owned devices.
- **AI Diagnostics**: Get instant repair quotes using Gemini AI.
- **Smart Valuation**: AI-powered price estimation for selling your devices.
- **Repair Tracking**: Real-time updates on your device repair status.
- **Admin Dashboard**: Manage inventory, repair requests, and valuation tickets.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS 4, Motion
- **Backend**: Firebase (Auth, Firestore)
- **AI**: Google Gemini API
