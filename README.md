# DevPulse — Internal Tech Issue & Feature Tracker

DevPulse is a collaborative platform for software development teams to report bugs, suggest features, and coordinate resolutions. It enforces role-based access control (RBAC), strict request validation, and clean database transactions using native PostgreSQL queries.

- **GitHub Repository**: [mohammadirfan90/DevPulse](https://github.com/mohammadirfan90/DevPulse)
- **Live Deployment**: [https://devpulse-api.onrender.com](https://devpulse-api.onrender.com) (or your deployment URL)

---

## 🛠️ Technology Stack

| Technology | Note |
|---|---|
| **Node.js** | LTS runtime environment |
| **TypeScript** | Strict compile-time type safety |
| **Express.js** | Modular router architecture |
| **PostgreSQL** | Relational database backend |
| **Raw SQL** | Native `pg` driver only (no ORMs, query builders, or SQL JOINs) |
| **bcrypt** | Secure password hashing (10 salt rounds) |
| **jsonwebtoken** | JWT-based client authentication and session tracking |

---

## ✨ Features

- **JWT-Based Authentication**: Public user registration and secure login returning standard JWT tokens.
- **Role-Based Access Control**: Permissions split between `contributor` and `maintainer` roles.
- **Collaborative Issue Tracking**: Create, read, update, and delete bug reports or feature requests.
- **Strict Business Logic Validation**:
  - Contributors can only update their own issues, and only if the status is `open`.
  - Maintainers can update any issue field and advance workflow status (`open` -> `in_progress` -> `resolved`).
  - Maintainers have exclusive permission to permanently delete issues.
- **JOIN-Free PostgreSQL Architecture**: Fetches related user/reporter information using batched query patterns to keep performance high and logic decoupled.
- **Unified Global Error Handler**: Express middleware capturing validation errors, JWT expirations, and database conflicts into standard JSON error formats.

---

## 🗄️ Database Schema Summary

The database defines three custom enum types and two primary tables:

### Custom Types
- `user_role` (`'contributor'`, `'maintainer'`)
- `issue_type` (`'bug'`, `'feature_request'`)
- `issue_status` (`'open'`, `'in_progress'`, `'resolved'`)

### Table: `users`
| Field | Type | Description |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing identifier |
| `name` | `VARCHAR(100) NOT NULL` | Display name of the user |
| `email` | `VARCHAR(100) UNIQUE NOT NULL` | Login email address |
| `password` | `VARCHAR(255) NOT NULL` | Hashed password |
| `role` | `user_role NOT NULL DEFAULT 'contributor'` | System access tier |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Time of account creation |
| `updated_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Last profile update timestamp |

### Table: `issues`
| Field | Type | Description |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing identifier |
| `title` | `VARCHAR(150) NOT NULL` | Title of the issue (max 150 chars) |
| `description` | `TEXT NOT NULL` | Description of the issue (min 20 chars) |
| `type` | `issue_type NOT NULL` | `bug` or `feature_request` |
| `status` | `issue_status NOT NULL DEFAULT 'open'` | Current workflow status |
| `reporter_id` | `INTEGER NOT NULL` | References the user who submitted the issue |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Issue creation timestamp |
| `updated_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Last updated timestamp |

---

## 🚀 API Endpoints Specification

### 🔹 Authentication Module

#### 1. User Registration
- **Endpoint**: `POST /api/auth/signup`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "password": "securePassword123",
    "role": "contributor"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": { "id": 1, "name": "John Doe", "email": "john.doe@devpulse.com", "role": "contributor", ... }
  }
  ```

#### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "john.doe@devpulse.com",
    "password": "securePassword123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "id": 1, "name": "John Doe", "email": "john.doe@devpulse.com", "role": "contributor" }
    }
  }
  ```

---

### 🔹 Issues Module

#### 3. Create Issue
- **Endpoint**: `POST /api/issues`
- **Access**: Authenticated Users (`contributor`, `maintainer`)
- **Headers**: `Authorization: <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug"
  }
  ```

#### 4. Get All Issues
- **Endpoint**: `GET /api/issues`
- **Access**: Public
- **Query Parameters**:
  - `sort`: `newest` (default) or `oldest`
  - `type`: `bug` or `feature_request`
  - `status`: `open`, `in_progress`, or `resolved`

#### 5. Get Single Issue
- **Endpoint**: `GET /api/issues/:id`
- **Access**: Public
- **Success Response (200 OK)**: Contains fully populated `reporter` details instead of raw ID.

#### 6. Update Issue
- **Endpoint**: `PATCH /api/issues/:id`
- **Access**: `maintainer` (any field/issue) OR `contributor` (own issue, title/description/type only, and only if status is `open`)
- **Headers**: `Authorization: <JWT_TOKEN>`
- **Request Body**: (Optional fields) `title`, `description`, `type`, `status` (maintainers only)

#### 7. Delete Issue
- **Endpoint**: `DELETE /api/issues/:id`
- **Access**: `maintainer` only
- **Headers**: `Authorization: <JWT_TOKEN>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Issue deleted successfully"
  }
  ```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js (v24.x LTS or higher)
- PostgreSQL database instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mohammadirfan90/DevPulse.git
cd DevPulse
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
CONNECTION_STRING=postgresql://username:password@localhost:5432/devpulse
JWT_SECRET=yourSuperSecureRandomSecretKeyString
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```
