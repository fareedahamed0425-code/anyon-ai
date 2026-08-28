<div align="center">
  <img src="frontend/public/favicon.svg" alt="Anyon AI Logo" width="120" height="120">
  
  # Anyon AI
  
  **The Unrestricted, High-Performance AI Assistant**
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
</div>

---

## 🌟 Overview

**Anyon AI** is a state-of-the-art, secure, and private conversational AI platform. Designed with a sleek, modern glassmorphism aesthetic, Anyon AI provides seamless access to a multitude of powerful language models, including unrestricted base models and the advanced **Kimi K3 (Vision) Supercomputer**.

## ✨ Key Features

- **🧠 Multi-Model Support**: Switch seamlessly between top-tier language models including GLM-4, DeepSeek, Nemotron, Llama 3, and more.
- **👁️ Kimi K3 Vision & Deep Reasoning**: Dedicated supercomputer workspace for deep thinking, complex problem solving, and document/image analysis.
- **🔒 Secure & Private**: Built-in UID-based isolation ensures your chat data is strictly yours. Powered by NeonDB PostgreSQL and Firebase Authentication.
- **💅 Premium UI/UX**: Stunning dark-mode glassmorphism design, fluid animations, auto-hiding navigation, and responsive layouts.
- **⚡ Blazing Fast**: React + Vite frontend backed by a high-performance Python FastAPI async server.
- **📂 File Handling**: Robust local caching for secure document processing and immediate auto-deletion for privacy.

---

## 🏗️ Architecture

The project is structured into two main components:

1. **/frontend**: A Vite-powered React application using pure CSS for a meticulously crafted custom design system. Features Firebase Auth and React-Markdown for rich response rendering.
2. **/backend**: A FastAPI server running Python, utilizing `asyncpg` for lightning-fast database operations with NeonDB PostgreSQL.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (3.9+)
- PostgreSQL Database (NeonDB recommended)
- Firebase Project

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables. Create a `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@host/db?sslmode=require
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8008 --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🎨 Design Philosophy

Anyon AI refuses to compromise on aesthetics. 
We utilize a carefully curated palette of deep indigos and slate greys, combined with backdrop-blur glass panels, micro-animations, and fluid flexbox layouts to create a workspace that feels truly *next-generation*.

## 🛡️ Security & Privacy

- **No Shared State**: Every chat session is strictly bound to the Firebase User UID. 
- **Ephemeral Storage**: Uploaded files and generated documents are stored in a temporary `./cache/` directory and securely wiped.
- **Environment Isolation**: All keys and database URLs are strictly ignored by version control.

---
<div align="center">
  <i>Engineered for the future of conversational AI.</i>
</div>
