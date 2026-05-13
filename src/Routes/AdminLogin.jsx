import { Link, useNavigate } from 'react-router-dom';
import { useFirebase } from "../Context/FirebaseContext";
import '../CSS/AdminLogin.css';
import Alert from '../Components/Alert';

const AdminLogin = () => {
    const { loginWithEmail } = useFirebase();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await loginWithEmail(formData.get("email"), formData.get("password"));
            navigate('/admin');
        } catch (err) {
            console.error("Login failed");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-8 col-md-6 col-lg-4">

                        <div className="admin-card p-4 p-md-5">
                            <Alert />
                            <div className="text-center mb-4">
                                <h2 className="admin-brand">ADMIN</h2>
                                <div className="gold-divider mx-auto"></div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label text-gold small text-uppercase fw-bold">Email</label>
                                    <input
                                        type="email"
                                        className="form-control admin-input"
                                        placeholder="Enter admin email"
                                        name="email"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-gold small text-uppercase fw-bold">Password</label>
                                    <input
                                        type="password"
                                        className="form-control admin-input"
                                        placeholder="••••••••"
                                        name="password"
                                    />
                                </div>

                                <div className="d-grid mt-5">
                                    <button type="submit" className="btn btn-gold-login py-3">
                                        ACCESS DASHBOARD
                                    </button>
                                </div>

                                <div className="text-center mt-3">
                                    <Link to="/" className="return-link">← Return to Lobby</Link>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;