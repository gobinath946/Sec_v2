# Secure Gateway - E-Sign Application

A modern React application built with Vite, Tailwind CSS, and Radix UI for secure electronic signature workflows.

## Tech Stack

- **React 18.3** - UI library
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **Material-UI (MUI)** - Component library (existing)
- **React Router v6** - Routing
- **Formik & Yup** - Form handling and validation
- **Axios** - HTTP client
- **Notistack** - Notification system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd "E sign/front/securegateway-messaging-service"
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
VITE_SERVER_ENV=LOCAL
VITE_API_BASE_URL=http://localhost:8083
VITE_FRONTEND_URL=http://localhost:3000/messagedetail/{%action%}/{%template%}/{%uid%}
```

### Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── Assets/           # Images and videos
├── Components/       # React components
│   ├── Admin/       # Admin dashboard components
│   ├── Ajm/         # AJM specific components
│   ├── Bwd/         # BWD specific components
│   ├── Sbho/        # SBHO specific components
│   ├── ui/          # Radix UI components (NEW)
│   └── ...
├── lib/             # Utility functions (NEW)
├── Service/         # API services
├── App.js           # Main app component
├── main.jsx         # Entry point (NEW - was index.js)
└── index.css        # Global styles with Tailwind
```

## New Features

### Tailwind CSS

Use utility classes throughout your components:

```jsx
<div className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-lg">
  <h1 className="text-2xl font-bold">Hello Tailwind!</h1>
</div>
```

### Radix UI Components

Pre-built accessible components in `src/components/ui/`:

```jsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  )
}
```

Available UI components:
- Button
- Card
- Dialog
- Input
- Label
- And more Radix UI primitives

### Path Aliases

Use `@/` to import from the src directory:

```jsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

## Environment Variables

All environment variables must be prefixed with `VITE_`:

- `VITE_SERVER_ENV` - Server environment (LOCAL, TEST, UAT, PROD)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_FRONTEND_URL` - Frontend URL template

Access them in code:
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

## Migration from Create React App

This project was migrated from Create React App to Vite. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details.

Key changes:
- `src/index.js` → `src/main.jsx`
- `process.env.REACT_APP_*` → `import.meta.env.VITE_*`
- `public/index.html` → `index.html` (root)
- Faster dev server and build times

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - All rights reserved

## Authors

- Gobinath
- Subasree
