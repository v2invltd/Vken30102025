# V-Ken Serve - AI-Powered Service Platform

V-Ken Serve is an AI-powered platform to find and book local home, corporate, and tour services across Kenya. It connects customers with trusted service providers and features secure booking, payment, and AI-driven search.

This document provides a complete guide to deploying the application to the web for testing and production use.

## Project Structure

- **`/` (root)**: Contains the frontend application source files (React, TypeScript). This part is served as a static site.
- **`/backend`**: Contains the Node.js, Express, and Prisma backend server. This is the application's "brain."

---

## Deployment Guide (Live on the Internet)

This guide will walk you through deploying the entire application to **Render**, a modern cloud hosting service with a free tier that is perfect for testing. This process will give you one public URL where your app will be live.

### Prerequisites

1.  **GitHub Account**: You need to upload the project code to a GitHub repository. [Sign up here](https://github.com/).
2.  **Render Account**: This is where we will host the application. [Sign up for a free account here](https://render.com/).
3.  **Cloud Database**: The app needs a PostgreSQL database that is accessible online. [Neon](https://neon.tech/) offers a great free option.

---

### Step 1: Get Your Cloud Database

1.  Go to [Neon](https://neon.tech/), sign up, and create a new project.
2.  Once your project is created, find the **Connection Details** or **Connection String**.
3.  Look for a URL that starts with `postgresql://...`. This is your `DATABASE_URL`.
4.  **Copy this URL.** You will need it in Step 3.

---

### Step 2: Push Your Project to GitHub

1.  Create a new repository on your GitHub account (e.g., `vken-serve-app`).
2.  Upload the entire project folder (including the `backend` directory) to this new repository.

---

### Step 3: Deploy on Render

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub account and select the repository you created in Step 2.
4.  Render will ask you to configure the service. Fill in the details as follows:
    - **Name**: `vken-serve` (or any name you prefer).
    - **Root Directory**: Leave this blank (it should be the root of your repo).
    - **Environment**: `Node`.
    - **Region**: Choose a region closest to you (e.g., Frankfurt).
    - **Branch**: `main` (or your default branch).
    - **Build Command**: `npm install --prefix backend && npx prisma generate --prefix backend`
      *This command tells Render to install the backend's dependencies and prepare the database client.*
    - **Start Command**: `npm start --prefix backend`
      *This command tells Render how to start your server.*

5.  Scroll down to the **Environment** section. This is the most important part.
    - Click **Add Environment Variable**.
    - You need to add three variables, using the "Secret File" feature is recommended but for simplicity you can add them directly for testing:
        1.  **Key**: `DATABASE_URL`
            - **Value**: Paste the database connection string you copied from Neon in Step 1.
        2.  **Key**: `API_KEY`
            - **Value**: Paste your Google Gemini API key.
        3.  **Key**: `JWT_SECRET`
            - **Value**: Create a long, random, and secret string. You can use a password generator for this. *Example: `my_super_secret_and_long_jwt_key_for_vken_serve`*

6.  Select the **Free** instance type at the bottom of the page.
7.  Click **Create Web Service**.

### Step 4: Run the Database Migration

After you create the service, Render will start building your application. This might fail the first time because the database is still empty. We need to manually run the migration to create the tables.

1.  Once your new service appears in the Render dashboard, go to its **Shell** tab.
2.  Wait for the shell to connect.
3.  Type the following command and press Enter:
    ```bash
    npx prisma migrate dev --name init --prefix backend
    ```
4.  This will set up your database schema. After it finishes, go to the **Events** tab or the **Logs** tab and trigger a new deploy by clicking "Manual Deploy" -> "Deploy latest commit".

### Step 5: Your App is Live!

Render will now build and deploy your application successfully. Once it's finished, you will see a "Live" status and a public URL at the top of the page (e.g., `https://vken-serve.onrender.com`).

**This is the link you can share with your well-wishers to test the full application!**

---

## Local Development (For Making Code Changes)

If you want to run the app on your own computer for development.

### 1. Backend Setup

1.  Navigate to the `backend` directory: `cd backend`.
2.  Create a `.env` file and copy the contents from `.env.example`. Fill in your `DATABASE_URL`, `API_KEY`, and `JWT_SECRET`. For local development, you can use a local PostgreSQL database via Docker.
3.  Install dependencies: `npm install`.
4.  Run the database migration: `npx prisma migrate dev --name init`.
5.  Start the server: `npm run dev`. It will run on `http://localhost:5000`.

### 2. Frontend Setup

The frontend requires no build step.

1.  From the **root** of the project, install a simple server: `npm install -g serve`.
2.  Run the server: `serve .`
3.  Open your browser to the URL provided (e.g., `http://localhost:3000`). The frontend will automatically connect to the local backend.
