# V-Ken Serve: Project Architecture & Navigation Guide

Welcome to the V-Ken Serve project! This document is your guide to understanding the application's structure, data flow, and key components. Use the links provided to dive deeper into the technologies we use.

## 1. Core Technologies

This is a modern full-stack application built with the following key technologies:

-   **Frontend**: [**React**](https://react.dev/) - A JavaScript library for building user interfaces.
-   **Backend**: [**Node.js**](https://nodejs.org/) with [**Express.js**](https://expressjs.com/) - A fast, minimalist web framework for building our API.
-   **Database**: [**PostgreSQL**](https://www.postgresql.org/) - A powerful, open-source object-relational database system.
-   **ORM**: [**Prisma**](https://www.prisma.io/) - A next-generation ORM for Node.js and TypeScript that makes database access easy and type-safe.
-   **AI**: [**Google Gemini API**](https://ai.google.dev/docs/gemini_api_overview) - Used for all intelligent features, including service parsing, profile generation, and the AI chatbot.
-   **Styling**: [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
-   **Deployment**: [**Google Cloud Run**](https://cloud.google.com/run/docs) - A fully managed serverless platform for deploying containerized applications.

---

## 2. Project Structure

The project is organized into a monorepo-style structure with distinct frontend and backend concerns.

```
/
├── backend/
│   ├── aiService.js         # (IMPORTANT) All backend logic for calling the Gemini API.
│   ├── server.js            # (IMPORTANT) The main Express.js server, defines all API endpoints.
│   ├── constants.js         # Backend enums/constants, mirrors frontend types.
│   ├── prisma/
│   │   └── schema.prisma    # Defines the database schema.
│   └── package.json         # Backend dependencies and scripts.
│
├── components/              # Reusable React components (e.g., buttons, modals, cards).
│
├── contexts/
│   └── AppContext.tsx       # (IMPORTANT) Global state management for the entire React app (user, bookings, modals, etc.).
│
├── frontend/
│   └── services/
│       └── api.ts           # (IMPORTANT) Frontend "API client". All `fetch` calls to the backend are defined here.
│
├── services/
│   └── kraPinService.ts     # A MOCK service for simulating KRA PIN validation.
│
├── tests/
│   └── e2e.spec.ts          # End-to-end tests using Playwright.
│
├── App.tsx                  # (IMPORTANT) The root React component. Renders all views and modals based on global state.
├── index.tsx                # The entry point for the React application.
├── index.html               # The main HTML file.
├── types.ts                 # (IMPORTANT) Central TypeScript types and enums used across the entire frontend.
├── legal.ts                 # Contains the text for legal documents (Terms, Privacy Policy).
├── cloudbuild.yaml          # Configuration for automated deployment on Google Cloud.
└── README.md                # Project README with deployment instructions.
```

---

## 3. Key Concepts & Data Flow

Understanding how data moves through the system is key to navigating the codebase.

### Example Flow: AI Service Search

1.  **User Action (`HomePage.tsx`)**: The user clicks the "Find Services with AI" button.
2.  **State Update (`AppContext.tsx`)**: This dispatches an action to open the `aiAssistant` modal.
3.  **Modal Interaction (`AiAssistant.tsx`)**: The user types "I need a plumber for a leaking tap in Nairobi" and clicks "Find Providers".
4.  **API Call (`App.tsx` -> `frontend/services/api.ts`)**: The `handleAiSearch` function in `App.tsx` calls `api.parseServiceRequest()`. This function in `api.ts` makes a `fetch` request to the backend endpoint `/api/ai/parse-service-request`.
5.  **Backend Processing (`backend/server.js`)**: The Express server receives the request. The authentication middleware verifies the user's JWT. The request is then passed to the handler for this route.
6.  **Gemini API Call (`backend/aiService.js`)**: The route handler calls the `parseServiceRequest` function in `aiService.js`. This function constructs a prompt for the [Gemini API](https://ai.google.dev/docs/gemini_api_overview), including the user's text and any attached image, and makes the API call. It's configured to use [Function Calling](https://ai.google.dev/docs/function_calling) to get a structured JSON response.
7.  **Backend Response (`backend/server.js`)**: The backend server receives the structured data from Gemini (`{ serviceCategory: 'Plumbing', location: 'Nairobi' }`) and sends it back to the frontend as a JSON response.
8.  **Frontend State Update (`App.tsx`)**: The `fetch` call in `api.ts` resolves. The `handleAiSearch` function in `App.tsx` receives the data and dispatches actions to:
    *   Set the active search category to `Plumbing`.
    *   Set the view to `AppView.SEARCH`.
    *   Close the AI assistant modal.
9.  **Render Results (`SearchResults.tsx`)**: The `App.tsx` component now renders the `<SearchResults />` component, which displays the list of plumbers fetched based on the new search criteria.

### Global State (`AppContext.tsx`)

This is the "brain" of the frontend. It uses React's `useReducer` hook for predictable state management. Almost every major action (logging in, opening a modal, changing a view) is handled by dispatching an action that is processed in `AppContext.tsx`. **When you're lost, start here** to understand how the state is being managed.

---

## 4. How Files are "Linked"

-   `index.html`: This is the entry point. It imports `index.tsx` via `<script type="module">`.
-   `index.tsx`: This is the React entry point. It imports `<App />` from `App.tsx` and renders it into the DOM.
-   `App.tsx`: This is the main orchestrator.
    -   It imports all major "page" components (like `HomePage`, `SearchResults`, `ProfilePage`) and all "modal" components (like `AuthModal`, `BookingModal`).
    -   It uses the `view` and `modal` state from `AppContext.tsx` to decide which component to render at any given time.
-   `frontend/services/api.ts` **<--->** `backend/server.js`: This is the primary frontend-to-backend link. Every function in `api.ts` corresponds to an API endpoint defined in `server.js`.
-   `backend/server.js` **--->** `backend/aiService.js`: The backend server delegates all AI-related tasks to the functions defined in `aiService.js`.
-   `backend/server.js` **<--->** `prisma/schema.prisma`: The server uses the Prisma client (which is generated from `schema.prisma`) to read from and write to the database.
-   `types.ts` **&** `backend/constants.js`: These files define the shape of the data. `types.ts` uses TypeScript interfaces for frontend type safety, while `constants.js` uses plain JavaScript objects for the backend. They must be kept in sync.