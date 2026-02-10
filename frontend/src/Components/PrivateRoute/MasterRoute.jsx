import React from 'react';
import { Navigate } from 'react-router-dom';

const MasterRoute = ({ children, redirectToPath }) => {
  const token = sessionStorage.getItem('token');
  const hasToken = !!token;

  return hasToken ? children : <Navigate to={redirectToPath} />;
};

export default MasterRoute;