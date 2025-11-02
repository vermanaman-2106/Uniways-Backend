# Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
PORT=3000
NODE_ENV=development

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://vermanaman2106_db_user:gqpuuxVjYznv4uIF@cluster0.gcms4tf.mongodb.net/Uniways?appName=Cluster0

# JWT Secret Key (IMPORTANT: Change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (for reset password links)
FRONTEND_URL=http://localhost:8081
```

## Security Note

⚠️ **IMPORTANT**: Change `JWT_SECRET` to a strong, random string in production.

You can generate a secure secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Current Setup

- ✅ jsonwebtoken: v9.0.2
- ✅ bcryptjs: v2.4.3
- ✅ MongoDB: Connected to Uniways database
- ✅ User collection: "User"
- ✅ Faculty collection: "FacultyProfile"

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ name, email, password, role }`
  - Email must be: `@muj.manipal.edu` or `@jaipur.manipal.edu`
  - Role must be: `faculty` or `student`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `GET /api/auth/me` - Get current user (requires Bearer token)

- `POST /api/auth/forgot-password` - Request password reset
  - Body: `{ email }`
  - Sends password reset email with token

- `POST /api/auth/reset-password` - Reset password
  - Body: `{ resetToken, password }`
  - Returns: `{ token }` for automatic login

### Faculty
- `GET /api/faculty` - Get all faculty members
- `GET /api/faculty/:id` - Get single faculty member

