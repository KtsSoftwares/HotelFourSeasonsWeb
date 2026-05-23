import React, { useState } from 'react';
import { useFirebase } from '../Context/FirebaseContext';
import { parseAadhaarXML, verifyMobile, base64ToFile } from '../Utils/AadhaarUtils';
import Alert from './Alert';
import '../CSS/RegistrationStaffModal.css';

const RegistrationStaffModal = ({ onClose }) => {
    const { user, updateStaffProfile, uploadOrReplaceFile, setLoading } = useFirebase();
    const [verifying, setVerifying] = useState(false);
    const [aadhaarData, setAadhaarData] = useState({ hashedPhoneNumber: '', shareCode: '', lastDigit: '', photoBase64: '' });

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phoneNumber: '', dob: '', gender: '', photoURL: '',
        address: { careOf: '', location: '', vtc: '', district: '', state: '', pincode: '', country: '' }
    });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = await parseAadhaarXML(event.target.result);
                setFormData(prev => ({
                    ...prev,
                    firstName: parsed.firstName,
                    lastName: parsed.lastName,
                    dob: parsed.dob,
                    gender: parsed.gender,
                    address: parsed.address,
                }));
                setAadhaarData(prev => ({ ...prev, hashedPhoneNumber: parsed.hashedPhoneNumber, photoBase64: parsed.photoBase64 }));
            } catch (err) {
                alert("Invalid Aadhaar XML File");
            }
        };
        reader.readAsText(file);
    };

    const validateAndSubmit = async (e) => {
        e.preventDefault();
        setVerifying(true);

        try {
            const isValid = await verifyMobile(
                formData.phoneNumber,
                aadhaarData.shareCode,
                aadhaarData.lastDigit,
                aadhaarData.hashedPhoneNumber
            );

            if (!isValid) {
                alert("Verification failed!");
                setVerifying(false);
                return;
            }

            let finalData = { ...formData };

            if (aadhaarData.photoBase64) {
                setLoading(true);

                const photoFile = base64ToFile(aadhaarData.photoBase64, `profile_${user.uid}.jpg`);
                if (photoFile) {
                    const photoURL = await uploadOrReplaceFile(null, `Staff Images/${user.uid}`, photoFile);
                    finalData.photoURL = photoURL;
                    setFormData(prev => ({ ...prev, photoURL: photoURL }));
                } else {
                    console.warn("Photo conversion failed, proceeding without profile picture.");
                    setVerifying(false);
                    return;
                }
                setLoading(false);
            }

            await updateStaffProfile(finalData, true);
            onClose();
        } catch (error) {
            console.error("Registration Error:", error);
            setVerifying(false);
        }
    };

    return (
        <div className="modal d-block custom-modal-overlay">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content bg-dark border-gold-premium shadow-lg">
                    <div className="modal-header border-bottom border-secondary">
                        <h4 className="modal-title text-gold font-playfair fw-bold">Staff Registration</h4>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <form onSubmit={validateAndSubmit}>
                        <div className="modal-body p-4">
                            <Alert />

                            {/* SECTION 1: AADHAAR UPLOAD */}
                            <div className="section-title">Step 1: Identity Source</div>
                            <div className="glass-panel p-4 mb-4 rounded">
                                <div className="row g-4"> {/* Increased gutter for spacing */}
                                    <div className="col-md-4">
                                        <label className="premium-label">Aadhaar XML File</label>
                                        <input type="file" accept=".xml" onChange={handleFileChange}
                                            className="form-control premium-input file-input" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="premium-label">Share Code</label>
                                        <input type="text" placeholder="e.g. 1234"
                                            className="form-control premium-input"
                                            onChange={(e) => setAadhaarData({ ...aadhaarData, shareCode: e.target.value })}
                                            required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="premium-label">Last Digit of Aadhaar Number</label>
                                        <input type="text" placeholder="0-9"
                                            className="form-control premium-input text-center"
                                            onChange={(e) => setAadhaarData({ ...aadhaarData, lastDigit: e.target.value })}
                                            onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }}
                                            maxLength="1" required />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: VERIFICATION */}
                            <div className="section-title">Step 2: Verification</div>
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="premium-label">Mobile Number</label>
                                    <input type="text"
                                        className="form-control premium-input active-input"
                                        placeholder="Enter 10 digit number"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        maxLength="10" required />
                                </div>
                                <div className="col-md-6">
                                    <label className="premium-label">Full Name (Auto-filled)</label>
                                    <input type="text"
                                        className="form-control premium-input readonly-input"
                                        value={formData.firstName ? `${formData.firstName} ${formData.lastName}` : "Waiting for Aadhaar..."}
                                        readOnly />
                                </div>
                            </div>

                            {/* ADDRESS PREVIEW */}
                            {formData.address.location && (
                                <div className="address-box p-3 rounded border-start border-gold">
                                    <small className="text-gold fw-bold d-block mb-1">VERIFIED ADDRESS</small>
                                    <div className="text-light small">
                                        {formData.address.location}, {formData.address.vtc}, {formData.address.state} - {formData.address.pincode}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer border-top border-secondary">
                            <button type="button" className="btn btn-danger text-secondary text-white" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-gold px-4 fw-bold shadow-sm" disabled={verifying}>
                                {verifying ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</>
                                ) : "Register Profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegistrationStaffModal;