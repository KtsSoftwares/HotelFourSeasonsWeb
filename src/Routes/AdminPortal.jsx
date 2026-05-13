import React, { useState, useRef, useEffect } from 'react';
import '../CSS/AdminPortal.css';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useFirebase } from '../Context/FirebaseContext';
import Alert from '../Components/Alert';

const AdminPortal = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useFirebase();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const closeMobileMenu = () => {
        setIsSidebarOpen(false);
        setIsDropdownOpen(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
            closeMobileMenu();
            navigate('/adminLogin');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="admin-layout">
            {/* Header Navbar */}
            <nav className="navbar navbar-dark bg-dark sticky-top border-bottom-gold shadow px-3">
                <div className="container-fluid">
                    <div className="d-flex align-items-center">
                        {/* Hamburger for Mobile */}
                        <button
                            className="btn btn-link text-gold d-lg-none p-0 me-3"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <i className="bi bi-list fs-2"></i>
                        </button>
                        <div className="navbar-brand fw-bold text-gold font-playfair m-0">
                            FOUR SEASONS ADMIN
                        </div>
                    </div>

                    {/* Desktop Navigation Links (Hidden on Mobile) */}
                    <div className="d-none d-lg-flex align-items-center flex-grow-1 ms-4">
                        <ul className="navbar-nav d-flex flex-row gap-4">
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/admin/customerEntry">Customer Entry</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/admin/roomsDashboard">Rooms</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/admin/customerList">Guest List</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/admin/monthlyReport">Monthly Report</NavLink>
                            </li>
                        </ul>
                    </div>

                    {/* Profile Dropdown (Shared Desktop/Mobile) */}
                    <div className="dropdown" ref={dropdownRef}>
                        <button
                            className="btn btn-black text-light border-secondary dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3"
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className="status-green-dot"></div>
                            <span className="small d-none d-sm-inline">
                                {user?.displayName || user?.email || "Admin"}
                            </span>
                        </button>

                        <ul className={`dropdown-menu dropdown-menu-end dropdown-menu-dark border-gold shadow ${isDropdownOpen ? 'show' : ''}`}
                            style={{
                                position: 'absolute',
                                right: 0,
                                left: 'auto', // Force it to anchor to the right
                                marginTop: '10px'
                            }}>
                            <li className="px-3 py-2 border-bottom border-secondary">
                                <p className="mb-0 small text-secondary">Signed in as</p>
                                <p className="mb-0 fw-bold text-gold small text-truncate">{user?.email}</p>
                            </li>
                            <li>
                                <NavLink className="dropdown-item py-2" to="/admin/profile" onClick={closeMobileMenu}>
                                    <i className="bi bi-person-circle me-2"></i> My Profile
                                </NavLink>
                            </li>
                            <li><hr className="dropdown-divider bg-secondary" /></li>
                            <li>
                                <button className="dropdown-item text-danger py-2" onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay d-lg-none" onClick={closeMobileMenu}></div>}

            {/* Mobile Sidebar */}
            <aside className={`mobile-sidebar bg-dark d-lg-none ${isSidebarOpen ? 'open' : ''}`}>
                <div className="p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
                    <span className="text-gold fw-bold">MENU</span>
                    <button className="btn-close btn-close-white" onClick={closeMobileMenu}></button>
                </div>
                <div className="p-3">
                    <ul className="nav flex-column gap-2">
                        <li className="nav-item">
                            <NavLink className="nav-link mobile-link" to="/admin/customerEntry" onClick={closeMobileMenu}>
                                <i className="bi bi-plus-circle me-2"></i> Customer Entry
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link mobile-link" to="/admin/roomsDashboard" onClick={closeMobileMenu}>
                                <i className="bi bi-door-open me-2"></i> Rooms
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link mobile-link" to="/admin/customerList" onClick={closeMobileMenu}>
                                <i className="bi bi-people me-2"></i> Guest List
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link mobile-link" to="/admin/monthlyReport" onClick={closeMobileMenu}>
                                <i className="bi bi-people me-2"></i> Monthly Report
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </aside>

            <Alert />
            <div className="admin-content-area p-4">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminPortal;