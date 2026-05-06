<div align="center">
  
# 🏋️‍♂️ GDK Gym Management Platform

**A modern, lightning-fast, local-first gym management system built for seamless daily operations.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Overview

The **GDK Gym Platform** is a complete, self-hosted management suite designed to run locally on a gym desktop while providing internet-accessible features for members. It eliminates the need for expensive cloud subscriptions by using a clever hybrid approach: an Electron desktop app for administration and a secure Ngrok tunnel for remote QR attendance.

## ✨ Key Features

*   📱 **Smart QR Check-in System:**
    *   A dynamic QR code is displayed on the gym's front desk monitor.
    *   Members scan it with their phones (via Google Lens or any QR scanner) to mark attendance.
    *   Works even if members are on Mobile Data (4G/5G) via an integrated **Ngrok Tunnel**.
*   ⚡ **Live Dashboard:**
    *   Watch members check in in real-time with sub-3-second auto-refresh.
    *   View daily revenue, active member distribution, and peak hours at a glance.
*   🤖 **Automated Notifications (Telegram & Email):**
    *   **Check-in Alerts:** Instant Telegram notifications to the admin when a member arrives.
    *   **Welcome Messages:** Beautifully formatted onboarding emails when a new member joins.
    *   **Renewal & Expiry Reminders:** Automated warnings to keep retention high and debts low.
*   💳 **Financial Ledger:**
    *   Track active plans, upcoming renewals, and overdue payments.
    *   One-click membership renewals.
*   🔒 **Local-First Architecture:**
    *   Data stays on your machine (`dev.db` SQLite).
    *   Offline capable (Local WiFi mode automatically activates if internet drops).

---

## 🛠️ Technology Stack

**Frontend (Web & Desktop App):**
*   **React 18** + **Vite** for blazing fast performance.
*   **Tailwind CSS** for a premium, modern UI.
*   **Electron** wrapper for native desktop experience.
*   **Recharts** for interactive analytics.

**Backend (API):**
*   **Node.js** & **Express** REST API.
*   **Prisma ORM** with **SQLite** (Zero-config local database).
*   **Telegraf** for Telegram Bot integration.
*   **Nodemailer** for automated Gmail alerts.

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   A free [Ngrok account](https://ngrok.com/)
*   A Telegram Bot Token (from `@BotFather`)
*   A Gmail App Password

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Saighodke00/gym-platform.git
cd "gym-platform"
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (do **not** commit this file):
```env
# Database
DATABASE_URL="file:./dev.db"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_bot_token_here"
TELEGRAM_ADMIN_CHAT_ID="your_personal_chat_id_here"

# Email Setup
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_16_char_app_password"
```

### 4. Launch the System
Simply double-click the master launch script:
```bash
START_GYM_SYSTEM.bat
```
This single script automatically:
1. Cleans up old ghost processes.
2. Starts the secure Ngrok Internet Tunnel.
3. Boots up the local Node.js API and SQLite database.
4. Launches the Electron Desktop Dashboard.

---

## 🎨 Design Philosophy
This app was built with a strong focus on **Aesthetics and UX**. It intentionally avoids generic designs, opting instead for a vibrant, glassmorphic UI with dynamic micro-animations to create a premium feel for both gym owners and their members.

---
<div align="center">
  <p><i>Built for GDK Gym Management • Hosted Locally • Accessed Globally</i></p>
</div>
