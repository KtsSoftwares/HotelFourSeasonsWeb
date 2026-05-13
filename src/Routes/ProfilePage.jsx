import React, { useEffect, useState } from 'react';
import { useFirebase } from '../Context/FirebaseContext';
import '../CSS/ProfilePage.css';
import RegistrationStaffModal from '../Components/RegistrationStaffModal';
import Loader from '../Components/Loader';

const ProfilePage = () => {
    const { user, getStaffData, staffDetails, loading } = useFirebase();
    const [showRegModal, setShowRegModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!staffDetails) {
                await getStaffData();
            }
        };
        loadData();
    }, [user?.uid, getStaffData, staffDetails]);

    if (loading && !staffDetails) return <Loader />;

    const profile = staffDetails;

    return (
        <div className="container mt-3 text-light">
            <div className="row justify-content-center">
                <div className="col-md-8 bg-dark p-4 rounded shadow border-gold">
                    <div className="d-flex align-items-center gap-4 mb-2">
                        {/* Passport Size Image */}
                        <div className="passport-photo-container">
                            <img
                                src={profile?.photoURL || "https://via.placeholder.com/150?text=No+Image"}
                                alt="Staff"
                                className="staff-avatar"
                            />
                        </div>
                        <div>
                            <h2 className="text-gold mb-0">{profile?.firstName} {profile?.lastName}</h2>
                            <p className="text-white mb-2">{user?.email}</p>
                            <span className={`badge ${profile?.isAdmin ? 'bg-gold' : 'bg-secondary text-white'}`}>
                                {profile?.isAdmin ? 'Administrator' : 'Staff Member'}
                            </span>
                        </div>
                    </div>
                    <div className="uid-display mb-0">
                        <span className="text-white small uppercase-label">UID: </span>
                        <span className="text-light mono-text">{profile?.uid}</span>
                    </div>

                    <div className="row g-4 mt-2"> {/* Increased gap between rows */}
                        <div className="col-md-6">
                            <label className="profile-label">Phone Number</label>
                            <p className="profile-value">{profile?.phoneNumber || "Not Set"}</p>
                        </div>
                        <div className="col-md-6">
                            <label className="profile-label">Date of Birth</label>
                            <p className="profile-value">{profile?.dob || "Not Set"}</p>
                        </div>
                        <div className="col-md-6">
                            <label className="profile-label">Date of Joining</label>
                            <p className="profile-value">{profile?.getJoinDateString()}</p>
                        </div>
                        <div className="col-md-6">
                            <label className="profile-label">Admin</label>
                            <p className="profile-value">{profile?.isAdmin ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="col-12">
                            <label className="profile-label">Registered Address</label>
                            <div className="profile-value address-text">
                                {profile?.address ? (
                                    <>
                                        <span className="d-block mb-1 fw-bold text-gold">{profile.address.careOf}</span>
                                        {profile.address.location}, {profile.address.vtc},<br />
                                        {profile.address.district}, {profile.address.state} - {profile.address.pincode}
                                    </>
                                ) : "No address on file"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 d-flex justify-content-end">
                        {profile == null && <button className="btn btn-success px-4" onClick={() => setShowRegModal(true)}>Register Profile</button>}
                    </div>
                </div>
            </div>
            {showRegModal && <RegistrationStaffModal onClose={() => setShowRegModal(false)} />}
        </div>
    );
};

export default ProfilePage;