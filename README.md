# DocsEditor - Real-Time Collaborative Document Editor

DocsEditor is a full-stack web application that provides a real-time, collaborative document editing experience, similar to Google Docs. It is built with the MERN stack (MongoDB, Express.js, React, Node.js) and utilizes WebSockets via Socket.IO for seamless, instantaneous communication between clients.

## ✨ Features

- **Real-Time Collaboration**: Multiple users can edit the same document simultaneously, with changes reflected instantly for all participants.
- **User Authentication**: Secure user registration and login system with email verification and password encryption (bcrypt).
- **JWT-Based Sessions**: Employs JSON Web Tokens stored in secure, `httpOnly` cookies for robust and persistent user sessions.
- **Document Management**: Full CRUD (Create, Read, Update, Delete) functionality for documents.
- **Role-Based Sharing**: Document owners can share their work with other users, assigning specific roles like 'Editor', 'Commenter', or 'Viewer'.
- **Email Notifications**: Automated emails for account verification, password resets, and document sharing invitations, powered by Nodemailer.
- **Version History**: Automatically or manually save snapshots of a document. Users can view a complete history and restore any previous version.
- **Live Commenting**: Add and delete comments on documents, with real-time updates for all collaborators.
- **Active User Display**: See the avatars of other users who are currently viewing or editing the document.
- **Secure Password Reset**: A secure, OTP-based flow for users who have forgotten their password.
- **Account Management**: Users can update their profile information (username, email, password) or perform a "soft delete" of their account.

## 🛠️ Tech Stack

| Category      | Technology                                                                                             |
|---------------|--------------------------------------------------------------------------------------------------------|
| **Backend**   | Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JSON Web Tokens (JWT), Nodemailer, Bcrypt.js         |
| **Frontend**  | React, Vite, Socket.IO Client, React Router, Axios, Quill (for the rich text editor)                    |
| **Deployment**| Designed for services like Render, Vercel, or any platform supporting Node.js and static site hosting. |

## 📂 Project Structure

The project is organized into two main directories: `frontend` and `backend`.

```
DocsEditor/
├── backend/
│   ├── controllers/  # Business logic for API endpoints
│   ├── middlewares/  # Express middlewares (e.g., authentication)
│   ├── models/       # Mongoose database schemas
│   ├── routes/       # API route definitions
│   ├── index.js      # Server entry point, Socket.IO setup, and Express config
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/ # Reusable React components
    │   ├── context/    # React context for global state management (e.g., DocumentContext)
    │   ├── pages/      # Page-level components (e.g., Home, Editor, Login)
    │   ├── App.jsx     # Main application component with routing
    │   └── main.jsx    # Frontend entry point
    └── package.json
```

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn
- MongoDB (a local instance or a cloud-hosted service like MongoDB Atlas)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/DocsEditor.git
    cd DocsEditor
    ```

2.  **Configure the Backend:**
    - Navigate to the backend directory:
      ```bash
      cd backend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the `/backend` directory. Copy the contents of `.env.example` (if available) or use the template below:
      ```env
      # --- Database and Server ---
      MONGO_URI=your_mongodb_connection_string
      JWT_SECRET=your_super_strong_and_random_jwt_secret
      PORT=3300

      # --- Email Service (using Gmail App Password) ---
      # Optional: Required for email verification, password reset, and sharing notifications.
      EMAIL_USER=your_email@gmail.com
      EMAIL_PASS=your_gmail_app_password

      # --- Frontend URL ---
      # The URL of your running frontend application
      FRONTEND_URL=http://localhost:5173
      ```
    - Start the backend server:
      ```bash
      npm start
      ```
      The server will be running on `http://localhost:3300` (or the port you specified).

3.  **Configure the Frontend:**
    - Open a **new terminal** and navigate to the frontend directory:
      ```bash
      cd frontend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Start the frontend development server:
      ```bash
      npm run dev
      ```
    - Open your browser and navigate to `http://localhost:5173`.

## 🌐 API Endpoints

The backend exposes a RESTful API for handling authentication and document management.

| Method   | Endpoint                               | Description                                     |
|----------|----------------------------------------|-------------------------------------------------|
| `POST`   | `/auth/signup`                         | Register a new user.                            |
| `POST`   | `/auth/signin`                         | Log in a user and set the session cookie.       |
| `POST`   | `/auth/update`                         | Update user profile details.                    |
| `DELETE` | `/auth/delete`                         | Soft-delete the authenticated user's account.   |
| `POST`   | `/api/password-reset/request`          | Request a password reset OTP.                   |
| `POST`   | `/api/password-reset/reset`            | Reset password using a valid OTP.               |
| `POST`   | `/api/documents`                       | Create a new document.                          |
| `GET`    | `/api/documents`                       | Get all documents owned by the user.            |
| `GET`    | `/api/documents/:id`                   | Get a single document by its ID.                |
| `PUT`    | `/api/documents/:id`                   | Update a document's content or title.           |
| `DELETE` | `/api/documents/:id`                   | Delete a document.                              |
| `POST`   | `/api/documents/:id/share`             | Share a document with another user.             |
| `POST`   | `/api/documents/:id/comment`           | Add a comment to a document.                    |
| `DELETE` | `/api/documents/:id/comment/:commentId`| Delete a comment from a document.               |
| `GET`    | `/api/documents/:id/versions`          | Get the version history for a document.         |
| `POST`   | `/api/documents/:id/versions/:versionId`| Restore a document to a previous version.      |

## 🔌 WebSocket Events

Real-time functionality is handled by Socket.IO events.

### Client to Server

- `join-document (documentId, user)`: Sent when a user opens a document to join the corresponding room.
- `send-changes (documentId, changes)`: Sent when a user types in the editor, broadcasting the changes.
- `leave-document (documentId)`: Sent when a user navigates away from the document page.

### Server to Client

- `receive-changes (changes)`: Broadcasts content changes to all other clients in the room.
- `active-users (users[])`: Sends the updated list of currently active users in the room.
- `new-comment (comment)`: Broadcasts a newly added comment to all clients.
- `delete-comment (commentId)`: Informs clients that a comment has been deleted.

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.