import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/utils/auth-context'; // Adjust path as needed

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext

  if (loading) {
    return <div>Loading...</div>; // Show a loading state while checking user
  }

  if (!user) {
    // If the user is not logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  return children; // If the user is logged in, render the protected route
};

export default ProtectedRoute;
