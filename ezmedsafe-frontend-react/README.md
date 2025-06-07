# 🌐 ezMedSafe Frontend Application

This repository contains the user-facing application for ezMedSafe, providing an intuitive interface for healthcare professionals to manage patient data, check drug interactions, and review alert history.

## 🌟 Key Functionalities

* **Multi-Page Application:** Dedicated pages for Login, Home (Interaction Checker), and Alert History.
* **Intuitive Forms:** User-friendly input forms for patient context and medications, including auto-suggest.
* **Dynamic Alert Display:** Presents AI-generated explainable alerts clearly, highlighting severity, mechanism, clinical implication, and recommendation.
* **Patient Profile Management:** Allows selection and creation of patient profiles.
* **History View:** Displays a paginated list of past interaction alerts.
* **Styling:** Modern and responsive design using Tailwind CSS and Shadcn UI components.

## 🚀 Tech Stack

* **Framework:** React
* **Build Tool:** Vite
* **Routing:** React Router DOM
* **Styling:** Tailwind CSS, Shadcn UI
* **API Calls:** Standard `fetch` API, centralized in `src/api/ezmedsafeApi.js`
* **State Management:** React's `useState`, `useEffect`, `useContext`
* **Notifications:** `sonner` for toasts

## 📂 Project Structure

```
ezmedsafe-frontend-react/
├── public/                # Static assets (e.g., favicon, logo)
├── src/
│   ├── api/               # Centralized API client (ezmedsafeApi.js)
│   ├── assets/            # Frontend-specific assets (e.g., images, fonts)
│   ├── components/        # Reusable UI components (e.g., Navbar, MedicationInput, UI primitives from shadcn)
│   │   └── common/        # General-purpose components (e.g., Navbar)
│   │   └── ui/            # Shadcn UI wrapper components
│   ├── contexts/          # React Contexts (e.g., AuthContext for authentication state)
│   ├── hooks/             # Custom React Hooks (e.g., useAuth)
│   ├── lib/               # Utility functions (e.g., Tailwind CSS merge)
│   ├── pages/             # Main application pages (App.jsx, LoginPage.jsx, HomePage.jsx, AlertHistoryPage.jsx)
│   ├── App.jsx            # Main application component, sets up routing and global context
│   ├── main.jsx           # React app entry point
│   └── index.css          # Main CSS file (imports Tailwind base styles and custom theming)
├── .env                   # Environment variables for frontend build
├── Dockerfile             # Docker build instructions for the Nginx server
├── nginx.conf             # Nginx configuration for serving the React app and proxying API requests
├── package.json           # Node.js project dependencies and scripts
├── postcss.config.js      # PostCSS configuration for Tailwind CSS
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.js         # Vite build configuration
```

## ⚙️ Setup and Running

### Dependencies
* `ezMedSafe` Backend service running (accessible via `http://localhost:3000`).

### Environment Variables (`.env`)
Create a `.env` file in the `ezmedsafe-frontend-react/` directory:

```bash
VITE_API_BASE_URL=http://localhost:80/api  # Nginx will proxy /api to backend
VITE_API_KEY=your_dev_api_key_123          # Not used for authentication now
```

### Running the Frontend

#### 1. Via Docker Compose (Recommended for deployment)
The `docker-compose.yml` in the root will build and run this service using Nginx.
* Ensure Nginx is correctly configured (`nginx.conf`) to serve the React build and proxy API requests.

#### 2. Locally for Development (using Vite's dev server)
From `ezmedsafe-frontend-react/` directory:

```bash
npm install
npm run dev  # Starts the Vite development server (usually on http://localhost:5173)
```

> **Note:** When running locally, Vite's dev server handles proxying API requests. Ensure your `VITE_API_BASE_URL` in `.env` matches the backend's direct URL if you're not using Nginx for local dev.

## 🌐 Nginx Configuration (`nginx.conf`)

This file is critical when deploying with Docker Compose. It instructs Nginx to:
* Serve the static build files of the React application.
* Use `index.html` as a fallback for client-side routing (e.g., `/login`, `/history`).
* **Proxy all requests starting with `/api/`** to the `backend` service running on port `3000` within the Docker network.

## 🐛 Troubleshooting

* Check browser's developer console (F12) for network errors or JavaScript issues.
* Verify Nginx logs (`docker logs ezmedsafe-frontend-1`) for proxying errors.
* Ensure `VITE_API_BASE_URL` in `.env` is correct.