export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Secure Gateway';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  // User endpoints
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    GET: (id: string) => `/users/${id}`,
  },
  // Template endpoints
  TEMPLATES: {
    LIST: '/templates',
    CREATE: '/templates',
    UPDATE: (id: string) => `/templates/${id}`,
    DELETE: (id: string) => `/templates/${id}`,
    GET: (id: string) => `/templates/${id}`,
    PREVIEW: (id: string) => `/templates/${id}/preview`,
  },
  // Document endpoints
  DOCUMENTS: {
    INITIATE: '/documents/initiate',
    SEND: (sessionId: string) => `/documents/${sessionId}/send`,
    GET: (sessionId: string) => `/documents/${sessionId}`,
    SIGN: (sessionId: string) => `/documents/${sessionId}/sign`,
    VERIFY_MFA: (sessionId: string) => `/documents/${sessionId}/verify-mfa`,
  },
  // Settings endpoints
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    TEST_CONNECTION: '/settings/test-connection',
  },
  // Messages endpoints
  MESSAGES: {
    LIST: '/messages',
    GET: (id: string) => `/messages/${id}`,
    RESEND: (id: string) => `/messages/${id}/resend`,
    CANCEL: (id: string) => `/messages/${id}/cancel`,
  },
  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITY: '/dashboard/activity',
  },
  // Platform admin endpoints
  PLATFORM: {
    COMPANIES: '/platform/companies',
    USERS: '/platform/users',
  },
};
