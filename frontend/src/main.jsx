import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { AuthProvider } from './Components/PrivateRoute/AuthContext'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import ProtectedApp from './ProtectedApp'

const theme = createTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <SnackbarProvider>
      <AuthProvider>
        {/* <ProtectedApp /> */}
        <App />
      </AuthProvider>
    </SnackbarProvider>
  </ThemeProvider>
)

reportWebVitals()
