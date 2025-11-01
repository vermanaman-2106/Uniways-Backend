# Uniways Backend API

Backend server for the Uniways application built with Express.js and MongoDB.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and set your MongoDB connection string:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/uniways
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /` - API status check
- `GET /api/health` - Health check endpoint
- `GET /api/test` - Test route

## Project Structure

```
backend/
├── config/
│   └── database.js      # MongoDB connection
├── routes/
│   └── index.js         # API routes
├── models/              # Mongoose models (add as needed)
├── controllers/         # Route controllers (add as needed)
├── middleware/          # Custom middleware (add as needed)
├── server.js            # Main server file
├── package.json
└── .env                 # Environment variables (create from .env.example)
```

