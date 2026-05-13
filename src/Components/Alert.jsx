import { useFirebase } from "../Context/FirebaseContext";
import '../CSS/Alert.css';

const Alert = () => {
    const { alert, setAlert } = useFirebase();

    return (
        <>
            {alert && (
                <div className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center`} role="alert">
                    {/* Dynamic Icon based on type */}
                    <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-octagon-fill'} me-2`}></i>

                    <div>
                        {alert.msg}
                    </div>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setAlert(null)}
                    ></button>
                </div>
            )}
        </>
    );
};

export default Alert;