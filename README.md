# 🚢 Marine Navigation Assistant - Setup & Usage Guide (Frontend)

Welcome! This guide is specifically designed to help those of you with no programming background (non-programmers) run and use the Marine Navigation Assistant web application on your local computer.

---

## 📋 Table of Contents
1. [Prerequisites: What Needs to be Installed?] (#1-prerequisites-what-needs-to-be-installed)
2. [Step 1: Downloading & Installing Node.js] (#step-2-downloading--installing-nodejs)
3. [Step 2: Setting Up the Configuration File (.env.local)] (#step-3-setting-up-the-envlocal-configuration-file)
4. [Step 3: Installing Supporting Packages] (#step-4-installing-supporting-packages)
5. [Step 4: Running the Application] (#step-5-running-the-application)
6. [🗺️ How to Use Key Features] (#-how-to-use-key-features)
7. [⚠️ Troubleshooting (Troubleshooting)](#%EF%B8%8F-troubleshooting-problem-solving)

---

## 1. Prerequisites: What Needs to be Installed?

Before running the application, make sure your computer has:
* Node.js (Minimum version 18.0 or later) - This is the main engine that runs the frontend server on your computer.
* Terminal / Command Prompt - Your computer's default application for typing concise commands.
* On Windows: Use Command Prompt (CMD) or PowerShell.
* On macOS / Linux: Use Terminal.

---

## Step 1: Downloading & Installing Node.js

If you don't have Node.js installed on your computer, follow these steps:

1. Open a browser (Chrome/Edge/Safari) and visit the official website: [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version, which is recommended for most users because it is the most stable.
3. Open the downloaded file and follow the installation instructions until complete (click *Next* / *Continue* / *Install* until complete).
4. To ensure Node.js is installed correctly:
* Open **Command Prompt (Windows)** or **Terminal (Mac)**.
* Type the following command and press **Enter**:
```bash
node -v
```
* If a version number appears (e.g., `v20.11.0`), Node.js has been successfully installed and is ready to use!

---

## Step 2: Preparing the Configuration File (.env.local)

The application requires some configuration keys (credentials) to connect to the Supabase database and the artificial intelligence server (FastAPI) on the backend.

1. Open the **`frontend`** folder using File Explorer (Windows) or Finder (Mac).
2. Locate the file named **`.env.example`**.
3. **Copy** the file and then **Paste** it into the same folder to create a duplicate file.
4. Rename the copied file to **`.env.local`** (make sure to keep the dot at the beginning of the file name).

5. Open the **`.env.local`** file using **Notepad**, **TextEdit**, or another text editor, then adjust its contents:

```env
# Your Supabase project URL (found in the Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Your Supabase Anonymous / Publishable API Key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anonymous-key

# Artificial Intelligence (FastAPI) backend server address
# Default is http://127.0.0.1:8000 if the backend is running on your local computer
NEXT_PUBLIC_MARINE_API_URL=http://127.0.0.1:8000
```
6. Save the file (Ctrl + S on Windows or Cmd + S on Mac).

---

## Step 3: Installing Supporting Packages

This step is necessary to download the library modules required for the application to run properly.

1. Open Command Prompt (Windows) or Terminal (Mac).
2. Navigate to the project's `frontend` folder.
> 💡 **Quick Tip for Windows**: Open the `frontend` folder in File Explorer, click the address bar at the top, type `cmd`, and then press Enter. A Command Prompt window will open in the correct folder.
3. Type the following command and press Enter:
```bash
npm install
```
4. Wait for the download to complete (usually takes 1–3 minutes depending on your internet speed). This will create a new folder named `node_modules` in your `frontend` directory.

---

## Step 4: Running the Application

Once all preparations are complete, you can immediately start the application's local server:

1. In the same Command Prompt/Terminal, type the following command:
```bash
npm run dev
```
2. If successful, you will see green/white text like this:
```text
▲ Next.js 15.3.1
- Local: http://localhost:3000
- Network: http://192.168.1.10:3000
```
3. Open your browser (Google Chrome, Microsoft Edge, Safari, etc.), then type the following address in the search bar:
👉 **[http://localhost:3000](http://localhost:3000)**
4. Congratulations! The **Marine Navigation Assistant** application is now running on your local computer and is ready to use.

---

## 🗺️ How to Use Key Features

Once the web application page opens in your browser, here are the steps: