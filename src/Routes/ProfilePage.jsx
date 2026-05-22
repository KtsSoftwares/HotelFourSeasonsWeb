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
        <div className="container mt-3 text-light px-3">
            <div className="row justify-content-center mx-0">
                <div className="col-12 col-md-8 bg-dark p-3 p-sm-4 rounded shadow border-gold">

                    {/* HEADER SECTION: Switches from Column on Mobile to Row on Desktop */}
                    <div className="d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-3 gap-sm-4 mb-4">

                        {/* Passport Size Image */}
                        <div className="passport-photo-container flex-shrink-0">
                            <img
                                src={profile?.photoURL || "https://via.placeholder.com/150?text=No+Image"}
                                alt="Staff"
                                className="staff-avatar"
                            />
                        </div>

                        {/* Details Container */}
                        <div className="w-100 text-truncate-container">
                            <h2 className="text-gold mb-1 text-truncate-custom">{profile?.firstName} {profile?.lastName}</h2>
                            <p className="text-white-50 mb-2 text-wrap-custom">{user?.email}</p>
                            <span className={`badge ${profile?.isAdmin ? 'bg-gold' : 'bg-secondary text-white'}`}>
                                {profile?.isAdmin ? 'Administrator' : 'Staff Member'}
                            </span>
                        </div>
                    </div>

                    {/* UID DISPLAY: Ensured text wrap handles long strings safely */}
                    <div className="uid-display p-2 mb-3 rounded text-center text-sm-start bg-black-30">
                        <span className="text-white-50 small uppercase-label">UID: </span>
                        <span className="text-light mono-text d-block d-sm-inline mt-1 mt-sm-0 text-break">{profile?.uid}</span>
                    </div>

                    {/* GRID DETAILS SECTION: Explicit mobile-first col classes */}
                    <div className="row g-3 g-sm-4 mt-1">
                        <div className="col-12 col-sm-6">
                            <label className="profile-label">Phone Number</label>
                            <p className="profile-value">{profile?.phoneNumber || "Not Set"}</p>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="profile-label">Date of Birth</label>
                            <p className="profile-value">{profile?.dob || "Not Set"}</p>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="profile-label">Date of Joining</label>
                            <p className="profile-value">{profile?.getJoinDateString()}</p>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="profile-label">Admin</label>
                            <p className="profile-value">{profile?.isAdmin ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="col-12">
                            <label className="profile-label">Registered Address</label>
                            <div className="profile-value address-text text-break">
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

                    <div className="mt-4 d-flex justify-content-center justify-content-sm-end">
                        {profile == null && <button className="btn btn-success w-100 w-sm-auto px-4" onClick={() => setShowRegModal(true)}>Register Profile</button>}
                    </div>
                </div>
            </div>
            {showRegModal && <RegistrationStaffModal onClose={() => setShowRegModal(false)} />}
        </div>
    );
};

export default ProfilePage;