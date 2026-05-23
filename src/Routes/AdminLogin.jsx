import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFirebase } from "../Context/FirebaseContext";
import '../CSS/AdminLogin.css';
import Alert from '../Components/Alert';

const AdminLogin = () => {
    const { loginWithEmail, resetPassword } = useFirebase();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");

    // DYNAMIC UI VALIDATION: Calculates true/false on every change
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isEmailEmpty = email.trim() === "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            if (!isEmailValid || isEmailEmpty) return;
            await loginWithEmail(email, formData.get("password"));
            setEmail("");
            navigate('/admin');
        } catch (err) {
            console.error("Login failed");
        }
    };

    const handleResetPassword = async () => {
        if (isEmailEmpty || !isEmailValid) return;
        await resetPassword(email);
        setEmail("");
    }

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
                                        className={`form-control admin-input ${!isEmailValid && !isEmailEmpty ? 'is-invalid border-danger' : ''}`}
                                        placeholder="name@company.com"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {!isEmailValid && !isEmailEmpty && (
                                        <div className="text-danger small mt-1">
                                            <i className="bi bi-exclamation-circle me-1"></i> Please enter a valid email address structure.
                                        </div>
                                    )}
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

                                <div className="d-grid mt-5 submit-section">
                                    <button type="submit" className="btn btn-gold-login py-3" disabled={!isEmailValid || isEmailEmpty}>
                                        ACCESS DASHBOARD
                                    </button>
                                    <div className="text-center mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-link text-gold-subtle text-decoration-none small-reset-btn"
                                            onClick={handleResetPassword}
                                            disabled={isEmailEmpty}
                                            style={{ opacity: isEmailEmpty ? 0.5 : 1 }}
                                        >
                                            <i className="bi bi-shield-lock me-2"></i>Forgot Password? Send Reset Link
                                        </button>
                                    </div>
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