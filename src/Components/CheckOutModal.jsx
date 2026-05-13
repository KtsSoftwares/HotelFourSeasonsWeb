import { useState } from 'react';
import '../CSS/CheckOutModal.css';
import { Customer } from '../Models/Customer';

/**
 * @param {{ showCheckoutModal: boolean, setShowCheckoutModal: Function, guest: Customer, corpDetails: {companyName: string, companyAddress: {district: string, state: string, country: string}, companyGst: string}, setCorpDetails: Function, checkOut: Function }} props
 */
const CheckOutModal = ({ showCheckoutModal, setShowCheckoutModal, guest, corpDetails, setCorpDetails, checkOut }) => {

    const [emptyError, setEmptyError] = useState(false);

    const handleCorpUpdate = (field, value, subField = null) => {
        if (emptyError) setEmptyError(false);
        setCorpDetails(prev => {
            if (subField) {
                return {
                    ...prev,
                    [field]: { ...prev[field], [subField]: value }
                };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleFinalizeCheckout = () => {
        if (!corpDetails.companyName.trim() || !corpDetails.companyGst.trim() || !corpDetails.companyAddress.district.trim() || !corpDetails.companyAddress.state.trim() || !corpDetails.companyAddress.country.trim()) {
            setEmptyError(true);
            return;
        }

        if (window.confirm("Confirm Check-Out?")) {
            checkOut(guest.roomNumber);
        }
    };

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content animate-slide-up">
                {/* Gold Header matching RoomModal */}
                <div className="modal-header-gold">
                    <h3 className="font-playfair text-gold mb-0">
                        Checkout Review - Room {guest.roomNumber}
                    </h3>
                    <button className="close-btn" onClick={() => setShowCheckoutModal(false)}>&times;</button>
                </div>

                <div className="modal-body-scrollable">
                    {/* SECTION 1: LUXURY BILL PREVIEW */}
                    <div className="bill-preview-card mb-4">
                        <h5 className="text-gold border-bottom-gold pb-2 mb-3 small fw-bold uppercase">Summary</h5>
                        <div className="preview-grid">
                            <div className="preview-row">
                                <span className="admin-label-alt">Guest Name</span>
                                <span className="preview-value">{guest.name}</span>
                            </div>
                            <div className="preview-row">
                                <span className="admin-label-alt">Mobile Number</span>
                                <span className="preview-value">{guest.mobileNumber}</span>
                            </div>
                            <div className="preview-row">
                                <span className="admin-label-alt">Age</span>
                                <span className="preview-value">{guest.age}</span>
                            </div>
                            <div className="preview-row">
                                <span className="admin-label-alt">{guest.guardianType}</span>
                                <span className="preview-value">{guest.guardianName}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CORPORATE INPUTS */}
                    <div className="corporate-section">
                        <h5 className="text-gold border-bottom-gold pb-2 mb-3 small fw-bold uppercase">Billing Details</h5>
                        <div className="row g-3 mb-3">
                            <div className="col-12">
                                <label className="admin-label">Company Name</label>
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder="e.g. ABC Tech Pvt Ltd"
                                    value={corpDetails.companyName}
                                    onChange={(e) => handleCorpUpdate("companyName", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-12">
                                <label className="admin-label">Company District</label>
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder="Enter registered office district..."
                                    value={corpDetails.companyAddress.district}
                                    onChange={(e) => handleCorpUpdate("companyAddress", e.target.value, "district")}
                                    required
                                />
                                <label className="admin-label">Company State</label>
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder="Enter registered office state..."
                                    value={corpDetails.companyAddress.state}
                                    onChange={(e) => handleCorpUpdate("companyAddress", e.target.value, "state")}
                                    required
                                />
                                <label className="admin-label">Company Country</label>
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder="Enter registered office country..."
                                    value={corpDetails.companyAddress.country}
                                    onChange={(e) => handleCorpUpdate("companyAddress", e.target.value, "country")}
                                    required
                                />
                            </div>
                            <div className="col-12">
                                <label className="admin-label">Guest GST Number</label>
                                <input
                                    id='gstInput'
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder="18AAAAAAAAA0A0Z0"
                                    value={corpDetails.companyGst}
                                    onChange={(e) => handleCorpUpdate("companyGst", e.target.value.toUpperCase())}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer matching RoomModal */}
                <div className="modal-footer-admin">
                    {emptyError && (
                        <span className="text-danger small">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            Please enter all the details of the Company.
                        </span>
                    )}
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
                    <button type="button" className="btn btn-gold-admin px-4" disabled={emptyError} onClick={handleFinalizeCheckout}>
                        Confirm & Check-Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckOutModal;