# MIIT News - Full Stack News Application

## Project Overview

MIIT News is a full-stack news application with a React frontend and Node.js/Express/MongoDB backend. The application features a modern UI, full authentication system, and comprehensive admin panel for managing news content.

## Features

- User authentication (login, register, profile management)
- Role-based access control (admin, editor, user)
- News articles categorization and management
- Comments and interaction system
- Admin dashboard for content management
- Responsive design for all devices

## Technology Stack

### Frontend
- React with TypeScript
- React Router for navigation
- shadcn/ui and Tailwind CSS for styling
- Context API for state management

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- RESTful API architecture

## Project Setup

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8d95589a-6bcf-4988-8b8a-40c1857ff164) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps to set up the complete project:

### Frontend Setup

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd miit_news

# Step 3: Install frontend dependencies
npm install

# Step 4: Start the frontend development server
npm run dev
```

### Backend Setup

```sh
# Step 1: Navigate to the backend directory
cd backend

# Step 2: Install backend dependencies
npm install

# Step 3: Set up environment variables
# Make sure the .env file contains the following variables:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/miit_news
# JWT_SECRET=your_jwt_secret_key
# JWT_EXPIRE=30d

# Step 4: Make sure MongoDB is running locally
# If using MongoDB Atlas, update the MONGO_URI in .env

# Step 5: Seed the database with initial data (optional)
npm run seed

# Step 6: Start the backend development server
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Project Structure

```
miit_news/
├── src/               # Frontend source code
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and API services
│   ├── pages/         # Page components
│   └── App.tsx        # Main application component
├── backend/           # Backend source code
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   └── server.js      # Main server file
└── public/            # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### News Articles
- `GET /api/news` - Get all articles
- `GET /api/news/:id` - Get article by ID
- `POST /api/news` - Create article
- `PUT /api/news/:id` - Update article
- `DELETE /api/news/:id` - Delete article

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Comments
- `GET /api/comments/article/:articleId` - Get comments for an article
- `GET /api/comments` - Get all comments (admin only)
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment status (admin only)
- `DELETE /api/comments/:id` - Delete comment

## Development Workflow

1. Start both the frontend and backend development servers
2. The frontend will run on http://localhost:5173 by default
3. The backend will run on http://localhost:5000
4. The frontend communicates with the backend through the API endpoints

## Authentication Flow

The application uses JWT (JSON Web Tokens) for authentication:

1. User registers or logs in
2. Server validates credentials and returns a JWT token
3. Frontend stores the token in localStorage
4. Protected routes require valid token
5. Admin routes require admin role

## Deployment Considerations

### Frontend Deployment
- The frontend can be built using `npm run build`
- Deploy the contents of the `dist` directory to a static hosting service like Netlify, Vercel, or GitHub Pages

### Backend Deployment
- The backend can be deployed to services like Heroku, Render, or Railway
- Make sure to set up the environment variables in your hosting provider
- For MongoDB, consider using MongoDB Atlas for a hosted database solution

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
