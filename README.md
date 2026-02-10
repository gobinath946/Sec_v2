# Secure Gateway E-sign Platform

Multi-tenant electronic signature platform built with MERN stack.

## Project Structure

```
Sec_v2/
├── backend/          # Node.js/Express backend (.js files)
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── models/       # Mongoose models
│   │   │   ├── master/   # Master database models
│   │   │   └── company/  # Company database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── index.js      # Entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/         # React frontend (.jsx files)
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   ├── App.jsx       # Main app component
    │   └── main.jsx      # Entry point
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection strings

5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Technology Stack

### Backend
- Node.js 18+
- Express 4+
- MongoDB 6+ with Mongoose
- JWT authentication
- Bcrypt for password hashing

### Frontend
- React 18+
- Vite
- Tailwind CSS
- Radix UI components
- Axios for API calls
- React Router for routing

## Features

- Multi-tenant architecture with isolated databases
- Role-based access control
- Template management with HTML and delimiters
- Electronic signature collection
- Multi-factor authentication (Email/SMS OTP)
- Event tracking and audit logging
- Storage provider integration (S3, Dropbox, Google Drive)
- Email/SMS notifications
- PDF generation
- API callbacks

## Development

- Backend runs on port 5000
- Frontend runs on port 3000
- API proxy configured in Vite for development

## Testing

Run tests:
```bash
npm test
```

Run property-based tests:
```bash
npm run test:pbt
```

## License

ISC
