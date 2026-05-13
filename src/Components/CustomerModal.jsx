import React, { useState } from 'react';
import '../CSS/RoomModal.css'; // Same CSS file from RoomModal for consistent styling
import '../CSS/CustomerModal.css'; // Additional styles specific to CustomerModal
import ZoomedImg from './ZoomedImg';
import { Customer } from '../Models/Customer';

/**
 * @param {{ selectedGuest: Customer, setSelectedGuest: Function, cachedGuestAndCompanions: Customer[] }} props
 */
const CustomerModal = ({ selectedGuest, setSelectedGuest, cachedGuestAndCompanions }) => {

    const [zoomedImg, setZoomedImg] = useState(null);
    /** @type {[Customer, React.Dispatch<React.SetStateAction<Customer>>]} */
    const [viewingGuest, setViewingGuest] = useState(selectedGuest);

    return (
        <div className="custom-modal-overlay" onClick={() => setSelectedGuest(null)}>
            {/* Wider modal for breathing room (w-100 max-width: 900px) */}
            <div className="custom-modal-content customer-detail-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="companion-tabs d-flex bg-black p-2 gap-2 border-bottom border-gold-subtle">
                    { cachedGuestAndCompanions.length > 0 && cachedGuestAndCompanions.map((g) => (
                        <button
                            key={g.id}
                            className={`btn-tab ${viewingGuest.id === g.id ? 'active' : ''}`}
                            onClick={() => setViewingGuest(g)}
                        >
                            {g.id === selectedGuest.id ? '⭐ Lead: ' : ''} {g.name?.split(' ')[0]}
                        </button>
                    ))}
                </div>

                <div className="modal-header-gold">
                    <div>
                        <h3 className="font-playfair text-gold mb-0">{viewingGuest.name}</h3>
                        <span className="text-white-50 small">Guest ID: {viewingGuest.id}</span>
                    </div>
                    <button className="close-btn" onClick={() => setSelectedGuest(null)}>&times;</button>
                </div>

                <div className="modal-body-scrollable p-4 bg-dark-deep">
                    <div className="container-fluid">
                        <div className="row g-5"> {/* Increased gutter for space */}

                            {/* Left Column: Personal & Travel Info */}
                            <div className="col-lg-7">
                                <section className="mb-5">
                                    <h5 className="section-title-gold">{viewingGuest.id === selectedGuest.id ? 'Primary' : 'Companion'} Details</h5>
                                    <div className="row row-cols-2 g-3">
                                        <div className="info-item">
                                            <label>Age</label>
                                            <p>{viewingGuest.age}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Mobile Number</label>
                                            <p>{viewingGuest.mobileNumber}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>{viewingGuest.guardianType}</label>
                                            <p>{viewingGuest.guardianName}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Room Number</label>
                                            <p className="text-gold fw-bold">#{viewingGuest.roomNumber}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-5">
                                    <h5 className="section-title-gold">Address & Company Details</h5>
                                    <div className="info-item mb-3">
                                        <label>Full Address</label>
                                        <p>{`${viewingGuest.address.areaName}, ${viewingGuest.address.district}, ${viewingGuest.address.state} - ${viewingGuest.address.pincode}, ${viewingGuest.address.country}`}</p>
                                    </div>

                                    {/* Company Details in a clean 2-column grid */}
                                    <div className="row row-cols-2 g-3 mb-3">
                                        <div className="info-item">
                                            <label>Company Name</label>
                                            <p>{viewingGuest.companyName || "Not Checked out yet"}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Company GST</label>
                                            <p>{viewingGuest.companyGst || "N/A"}</p>
                                        </div>
                                        <div className="info-item col-12 mt-3">
                                            <label>Company Address</label>
                                            <p>{viewingGuest.companyAddress.district ? `${viewingGuest.companyAddress.district}, ` : ""}{viewingGuest.companyAddress.state ? `${viewingGuest.companyAddress.state} ` : ""}{viewingGuest.companyAddress.country ? viewingGuest.companyAddress.country : ""}</p>
                                        </div>
                                    </div>
                                    <h5 className="section-title-gold">Travel Information</h5>
                                    <div className="row row-cols-2 g-3">
                                        <div className="info-item">
                                            <label>Coming From</label>
                                            <p>{viewingGuest.travel.comingFrom}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Going To</label>
                                            <p>{viewingGuest.travel.goingTo}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Profession</label>
                                            <p>{viewingGuest.travel.profession}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Purpose</label>
                                            <p>{viewingGuest.travel.purpose}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: ID Cards Gallery */}
                            <div className="col-lg-5">
                                <h5 className="section-title-gold">Identity Documents</h5>
                                <div className="id-card-container">
                                    <label className="bill-label mb-2">Front Side</label>
                                    <div className="id-image-box" onClick={() => setZoomedImg(viewingGuest.idCard.front)}>
                                        <img src={viewingGuest.idCard.front || "https://via.placeholder.com/150?text=No+Image"} alt="ID Front" />
                                        <div className="image-overlay-zoom">Click to Enlarge</div>
                                    </div>
                                </div>
                                <div className="id-card-container">
                                    <label className="bill-label mb-2">Back Side</label>
                                    <div className="id-image-box" onClick={() => setZoomedImg(viewingGuest.idCard.back)}>
                                        <img src={viewingGuest.idCard.back || "https://via.placeholder.com/150?text=No+Image"} alt="ID Back" />
                                        <div className="image-overlay-zoom">Click to Enlarge</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {zoomedImg && <ZoomedImg zoomedImg={zoomedImg} setZoomedImg={setZoomedImg} />}

                <div className="modal-footer-admin p-3 border-top border-secondary bg-black">
                    <div className="me-auto text-white small">
                        Checked-in by <strong>{viewingGuest.checkedInBy}</strong> on {viewingGuest.getCheckInDateString()}
                    </div>
                    <div className="me-auto text-white small">
                        {!viewingGuest.status && (
                            <>
                                Checked-out by <strong>{viewingGuest.checkedOutBy}</strong> on {viewingGuest.getCheckOutDateString()}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerModal;