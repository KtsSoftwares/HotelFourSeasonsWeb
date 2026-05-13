import { Navigate } from 'react-router-dom';
import { useFirebase } from './Context/FirebaseContext';
import Loader from './Components/Loader';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useFirebase();

    // While Firebase is still checking the session, show nothing (or loader)
    if (loading) return <Loader />;

    // If no user is logged in, redirect to the login page
    if (!user) {
        return <Navigate to="/adminLogin" replace />;
    }

    // If user exists, show the requested page
    return children;
};

export default ProtectedRoute;