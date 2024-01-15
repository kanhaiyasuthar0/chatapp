import React from 'react';
import { Route, Navigate } from 'react-router-dom'; // Import Navigate
import { useNavigate } from 'react-router-dom';

const PrivateRoute = ({ component: Component, isAuthenticated, ...rest }) => {
  const navigate = useNavigate();

  // Redirect to '/login' if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    // Return null to prevent rendering the route
    return null;
  }

  return <Route {...rest} element={<Component />} />;
};

export default PrivateRoute;
