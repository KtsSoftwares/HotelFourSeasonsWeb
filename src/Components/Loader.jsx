import { useFirebase } from '../Context/FirebaseContext';
import '../CSS/LoadingOverlay.css';
import KTSLogo from '../assets/Images/KTS_Logo.png'; 

const Loader = () => {
    const { loading } = useFirebase();

    if (!loading) return null;

    return (
        <div className="loading-overlay">
            <img src={KTSLogo} alt="Hotel Four Seasons" className="spinning-logo" />
            <div className="loading-text animate-pulse">Loading, please wait...</div>
        </div>
    );
};

export default Loader;