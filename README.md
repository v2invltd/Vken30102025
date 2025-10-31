# V-Ken Serve - AI-Powered Service Platform

This project is a full-stack AI-powered platform for finding and booking local services in Kenya.

---

## Simplified Google Cloud Deployment Guide

This guide assumes you have a Google Cloud account, a GitHub account, and have pushed this code to a new GitHub repository. The deployment is now heavily automated.

### Step 1: Set Up Your Google Cloud Project

1.  **Create a Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/), create a new project (e.g., `vken-serve-app`), and copy its **Project ID**.
2.  **Enable APIs**: In your new project, enable these APIs:
    *   Cloud Run
    *   Cloud SQL Admin
    *   Cloud Build
    *   Artifact Registry
    *   Secret Manager
    *   IAM
3.  **Install & Configure gcloud**: [Install the Cloud SDK](https://cloud.google.com/sdk/docs/install), then run `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID` in your terminal.

### Step 2: Create the Database (Cloud SQL)

1.  Go to the **SQL** page in the Cloud Console.
2.  Click **CREATE INSTANCE** -> **PostgreSQL**.
3.  **Instance ID**: `vken-serve-db`.
4.  **Generate and save** the `postgres` user password.
5.  Choose a **Region** (e.g., `us-central1`).
6.  Once created, go into the instance -> **Databases** -> **CREATE DATABASE** with the name `vken-serve-db`.
7.  Go back to the instance **Overview** page and **copy the Instance connection name**.

### Step 3: Store Your Secrets (Secret Manager)

1.  Go to the **Secret Manager** page in the Cloud Console.
2.  Create the following secrets. **The names must match exactly.**
    *   `API_KEY`: Your Google Gemini API key.
    *   `JWT_SECRET`: A long, random string for signing tokens.
    *   `VAPID_PUBLIC_KEY`: Your public key for web push notifications.
    *   `VAPID_PRIVATE_KEY`: Your private key for web push notifications.
    *   `DATABASE_URL`: The most important one. Use this template, filling in your details:
        `postgresql://postgres:YOUR_DB_PASSWORD@localhost/vken-serve-db?host=/cloudsql/YOUR_INSTANCE_CONNECTION_NAME`
3.  Go to the **IAM** page, find the member ending in `@cloudbuild.gserviceaccount.com`, and give it the **Secret Manager Secret Accessor** role.

### Step 4: Automate Deployment (Cloud Build)

1.  **Create Docker Repository**: Go to **Artifact Registry**, click **CREATE REPOSITORY**.
    *   **Name**: `vken-serve-repo`
    *   **Format**: `Docker`
    *   **Region**: Same as your SQL instance.
2.  **Create Deploy Trigger**: Go to **Cloud Build** -> **Triggers**.
    *   **Connect** your GitHub repository.
    *   **CREATE TRIGGER** with these settings:
        *   **Event**: `Push to a branch`
        *   **Branch**: `^main$`
        *   **Configuration**: `Cloud Build configuration file (yaml or json)`. Location should be `/cloudbuild.yaml`.
        *   **Advanced -> Substitution variables**:
            *   **Variable**: `_INSTANCE_CONNECTION_NAME`
            *   **Value**: Paste the **instance connection name** you copied from the SQL page.

### Step 5: Deploy

1.  **Push Your Code**: Commit your changes and push them to the `main` branch of your GitHub repository.
    ```bash
    git add .
    git commit -m "Deploy to Google Cloud"
    git push origin main
    ```
2.  **Monitor**: Go to the **Cloud Build History** page to watch your automated deployment. Once it succeeds, go to the **Cloud Run** page to find the public URL for your live application.