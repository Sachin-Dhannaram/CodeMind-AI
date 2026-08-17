# CodeMind AI: Your AI-Powered Codebase Architect

![CodeMind AI Banner](https://img.shields.io/badge/CodeMind%20AI-Architecting%20the%20Future%20of%20Code-blueviolet?style=for-the-badge&logo=react&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.4.14-8A2BE2?style=for-the-badge&logo=chroma&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Pro-F4B400?style=for-the-badge&logo=google&logoColor=white)

---

## 🚀 Project Description

CodeMind AI is an innovative, AI-powered application designed to help developers and architects understand, navigate, and query complex codebases with unprecedented ease. By leveraging advanced natural language processing and vector database technologies, CodeMind AI transforms raw code into an intelligent, queryable knowledge base.

The application features a sleek, modern frontend built with React, Vite, and Tailwind CSS, providing an intuitive user experience for managing repositories, configuring AI settings, and interacting with the AI chat. The robust Python FastAPI backend handles all the heavy lifting: repository cloning, intelligent code parsing and chunking, embedding generation using state-of-the-art models, and efficient storage in a ChromaDB vector store.

**Key Features:**

-   **Intelligent Code Indexing:** Automatically clones, parses, chunks, and embeds code from your repositories, making it searchable and queryable.
-   **Real-time Progress Tracking:** Monitor the indexing process with detailed steps, status updates, and elapsed time.
-   **AI-Powered Chat:** Engage in natural language conversations with your codebase, asking questions about architecture, specific functions, or general logic.
-   **Customizable AI Settings:** Configure parameters like Gemini API key, Top-K retrieval for vector search, code chunk size, and LLM temperature directly from the UI.
-   **Repository Management:** Easily import and manage multiple code repositories.
-   **Modern UI/UX:** A responsive and visually appealing interface built with React and Tailwind CSS.
-   **Local Vector Database:** Utilizes ChromaDB for efficient and private storage of code embeddings.
-   **Google Gemini Integration:** Harnesses the power of Google's Gemini LLM for intelligent code understanding and response generation.
-   **BAAI/bge-small Embeddings:** Uses a high-performance embedding model for accurate code vectorization.

CodeMind AI aims to be an indispensable tool for code comprehension, architectural analysis, and developer productivity.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Python 3.9+**: For the backend server.
-   **Node.js (LTS recommended)**: For the frontend development.
-   **npm** or **Yarn**: Node.js package manager (npm comes with Node.js).
-   **Git**: Required for cloning repositories (both this project and the codebases you wish to index).

---

## 🚀 Installation

Follow these steps to get CodeMind AI up and running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/codemind-ai.git
cd codemind-ai
```

### 2. Backend Setup

Navigate to the `backend` directory, create a virtual environment, and install dependencies.

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

**Environment Variables:**

Create a `.env` file in the `backend` directory with your Google Gemini API key.

```
# .env in backend/
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```

You can obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Frontend Setup

Navigate to the `frontend` directory and install Node.js dependencies.

```bash
cd ../frontend

# Install Node.js dependencies
npm install # or yarn install
```

---

## 🏃 Usage

Once both the backend and frontend are set up, you can start the application.

### 1. Start the Backend Server

From the `backend` directory (with your virtual environment activated):

```bash
uvicorn main:app --reload --port 8000
```

This will start the FastAPI server, typically accessible at `http://localhost:8000`.

### 2. Start the Frontend Development Server

From the `frontend` directory:

```bash
npm run dev # or yarn dev
```

This will start the Vite development server, typically accessible at `http://localhost:3000`. The frontend is configured to proxy API requests to the backend (`/api` routes are forwarded to `http://localhost:8000`).

### 3. Access the Application

Open your web browser and navigate to `http://localhost:3000`.

**Initial Steps:**

1.  **Login:** The application might have a placeholder login (e.g., "Lead Architect").
2.  **Settings:** Navigate to the `Settings` page. It's crucial to enter your `Gemini API Key` here if you haven't set it as an environment variable or wish to override it. You can also adjust `Top-K Retrieval`, `Chunk Size`, and `Temperature` for the AI model.
3.  **Upload/Import Repository:** Go to the `Upload` page to import a new codebase. You can provide a Git URL or upload local files.
4.  **Indexing:** Once a repository is imported, it will automatically begin the indexing process. The `Indexing` page will show real-time progress, detailing steps like cloning, parsing, chunking, embedding generation, and saving to ChromaDB.
5.  **Chat with AI:** After successful indexing, navigate to the `Chat` page. You can now ask questions about your codebase, and CodeMind AI will provide intelligent answers based on the indexed content.

---

## 📁 Folder Structure

The repository is organized into two main parts: `backend` (Python FastAPI) and `frontend` (React/Vite).

```
.
├── backend/
│   ├── main.py
│   ├── api/
│   │   └── routes.py
│   ├── models/
│   │   └── schemas.py
│   ├── services/
│   │   ├── chat_orchestrator.py
│   │   ├── chroma_db_manager.py
│   │   ├── chunker_service.py
│   │   ├── embedding_manager.py
│   │   ├── gemini_driver.py
│   │   ├── indexing_orchestrator.py
│   │   ├── parser_service.py
│   │   ├── prompt_service.py
│   │   └── repository_manager.py
│   └── utils/
│       └── logger.py
├── frontend/
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── api/
│       │   └── client.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── Sidebar.jsx
│       ├── context/
│       │   └── AppContext.jsx
│       └── pages/
│           ├── Chat.jsx
│           ├── Dashboard.jsx
│           ├── Explorer.jsx
│           ├── Indexing.jsx
│           ├── Login.jsx
│           ├── Settings.jsx
│           └── Upload.jsx
└── README.md
```

### Directory Breakdown:

#### `backend/`
This directory contains the Python FastAPI application responsible for all server-side logic, AI integrations, and data management.

-   `main.py`: The primary entry point for the FastAPI application, where the app instance is created and main configurations are set.
-   `api/`:
    -   `routes.py`: Defines all the API endpoints (e.g., `/repositories`, `/index`, `/chat`, `/settings`) that the frontend interacts with.
-   `models/`:
    -   `schemas.py`: Contains Pydantic models used for data validation, serialization, and deserialization of request and response bodies across the API.
-   `services/`: This is the core business logic layer, housing various services that encapsulate specific functionalities.
    -   `chat_orchestrator.py`: Manages the end-to-end AI chat interaction flow, coordinating between the LLM, retrieval, and prompt services.
    -   `chroma_db_manager.py`: Handles all interactions with the ChromaDB vector store, including storing, retrieving, and querying embeddings.
    -   `chunker_service.py`: Responsible for intelligently splitting large code files into smaller, semantically meaningful chunks suitable for embedding.
    -   `embedding_manager.py`: Manages the generation of vector embeddings for code chunks using models like BAAI/bge-small.
    -   `gemini_driver.py`: Provides an interface for communicating with the Google Gemini Large Language Model, handling API requests and responses.
    -   `indexing_orchestrator.py`: Orchestrates the entire repository indexing pipeline, from cloning to saving embeddings in ChromaDB.
    -   `parser_service.py`: Parses various code file types, extracting relevant text content and ignoring irrelevant parts (e.g., comments, build artifacts).
    -   `prompt_service.py`: Generates and manages the prompts sent to the LLM, ensuring context and instructions are correctly formatted.
    -   `repository_manager.py`: Handles operations related to code repositories, such as cloning, managing local storage, and tracking metadata.
-   `utils/`:
    -   `logger.py`: Configures and provides a centralized logging utility for the backend application.

#### `frontend/`
This directory contains the React application, built with Vite and styled with Tailwind CSS, providing the user interface.

-   `index.html`: The main HTML file that serves as the entry point for the React application.
-   `package.json`, `package-lock.json`: Configuration files for Node.js dependencies and scripts.
-   `postcss.config.js`, `tailwind.config.js`: Configuration files for PostCSS and Tailwind CSS, respectively.
-   `vite.config.js`: Configuration for Vite, the build tool, including proxy settings for the backend API.
-   `src/`: The source code for the React application.
    -   `App.jsx`: The root component of the React application, typically handling routing and global layout.
    -   `index.css`: Global CSS styles, often used for importing Tailwind CSS and custom base styles.
    -   `main.jsx`: The entry point for the React application, where the root React component is rendered into the DOM.
    -   `api/`:
        -   `client.js`: Configures an HTTP client (e.g., Axios) for making requests to the backend API.
    -   `components/`: Reusable UI components used across different pages.
        -   `Navbar.jsx`: The navigation bar component.
        -   `Sidebar.jsx`: A sidebar component, likely for navigation or displaying contextual information.
    -   `context/`: React Context API for global state management.
        -   `AppContext.jsx`: Provides global state (e.g., repositories, active repository, user info, settings, chat history, loading states) and functions to update them.
    -   `pages/`: Top-level components representing different views or pages of the application.
        -   `Chat.jsx`: The page where users can interact with the AI chat.
        -   `Dashboard.jsx`: A potential overview or landing page.
        -   `Explorer.jsx`: A page for browsing the files within an indexed repository.
        -   `Indexing.jsx`: Displays the real-time progress and status of a repository's indexing process.
        -   `Login.jsx`: The user login interface.
        -   `Settings.jsx`: Allows users to configure application settings, including AI parameters and API keys.
        -   `Upload.jsx`: The page for importing new code repositories into the system.
