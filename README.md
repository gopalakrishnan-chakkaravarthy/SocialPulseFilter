# SocialPulse - Social Video Filter & Trend Dashboard

SocialPulse is a full-stack dashboard application built with **React**, **Vite**, **Tailwind CSS**, and **Express**. It allows digital creators, marketers, and social managers to load live video uploads, analyze engagement trends, classify sentiment, and schedule/publish social media posts directly through integrated accounts.

---

## 🌟 Key Features

### 1. Unified Social Video Filter & Stream
* **Interactive Live Streams**: Stream video uploads directly from connected platforms.
* **Smart Filtering & Horizon Control**: Filter videos based on views, likes, upload dates, and custom keywords.
* **Search & Export**: Instantly search across titles or creators, and export filtered results to CSV formats.

### 2. Live Sentiment Analysis
* Uses advanced **semantic sentiment classification** to analyze comments, descriptions, and user feedback.
* Displays color-coded sentiment labels (Positive, Neutral, Negative) along with numeric scores to gauge audience reception instantly.

### 3. Engagement Tracking & 24h Trends
* Monitors real-time engagement fluctuations (Views, Likes, Comments).
* Highlighted trend badges powered by custom indicators showing whether engagement is trending upward or downward over the last 24 hours.

### 4. Configurable Multi-Platform Media Publisher
* **Multi-Media Drag-and-Drop**: Upload video clips or image assets directly.
* **Instant Social Distribution**: Target **YouTube**, **Facebook**, and **Instagram** simultaneously.
* **Account-Based OAuth Gateways**:
  * Integrates a secure login popout flow for unauthenticated accounts.
  * Dynamically detects whether a platform has an active session. If already logged in, posts are dispatched instantly.
  * If unauthenticated, it opens a secure, sandboxed OAuth popout portal for user authentication, then securely returns the session state without disrupting the current page flow.

---

## 🛠️ Technology Stack

* **Frontend**:
  * **React 18** with functional hooks.
  * **Vite** for rapid bundling.
  * **Tailwind CSS** for custom responsive grids, bento sections, and eye-safe twilight design colors.
  * **Framer Motion** (`motion/react`) for smooth animations, custom modals, and tab transitions.
  * **Lucide React** for beautiful, consistent iconography.
  * **Recharts / D3** for visual graphs displaying history and analytics.

* **Backend**:
  * **Express (Node.js)** handling asset routing, health checks, and secure endpoints.
  * Embedded **Mock OAuth Portal (`/auth-popup`)** for localized token handshake verification.

---

## 📂 Project Structure

```bash
├── src/
│   ├── App.tsx          # Main React application with dashboard modules & layout
│   ├── index.css        # Global stylesheet including custom Tailwind imports & font pairings
│   ├── main.tsx         # App entry-point mounting the root React virtual node
│   └── types.ts         # Centralized TypeScript definitions and enums
├── server.ts            # Production Express server & mock OAuth portal
├── index.html           # Document wrapper with configured meta titles
├── package.json         # Dependency configuration, scripts, and build tasks
└── vite.config.ts       # Vite bundler options and Tailwind setup
```

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Running Locally
1. Clone or download the repository.
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the application on [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security & OAuth Integration
All social accounts are managed locally inside secure sandboxed scopes. The system leverages:
* **`window.postMessage` API** for cross-origin login communication without exposing sensitive channel credentials.
* **LocalStorage Session Storage** keeping your connected accounts persisted only inside your local browser cache. Clicking **[Logout]** immediately destroys active tokens.
