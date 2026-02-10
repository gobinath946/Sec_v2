import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const PrivateRoute = ({ children, redirectToPath }) => {
  const { isAuthenticated } = useAuth(); 

  return isAuthenticated ? children : <Navigate to={redirectToPath} />;
};

export default PrivateRoute;