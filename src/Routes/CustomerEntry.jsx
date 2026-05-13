import React, { useState, useRef } from 'react';
import '../CSS/CustomerEntry.css';
import { useFirebase } from '../Context/FirebaseContext';

const CustomerEntry = () => {
    const formRef = useRef(null);
    const { rooms, uploadOrReplaceFile, setLoading, setAlert, getPreDocumentId, checkInTransaction } = useFirebase();
    const [selectedRoom, setSelectedRoom] = useState("");

    // Template for a fresh guest
    const createGuestTemplate = (isLead = false) => ({
        id: getPreDocumentId("customers"),
        isLead: isLead,
        name: '',
        age: '',
        mobileNumber: '',
        guardianName: '',
        guardianType: 'Father',
        otherGuardian: '',
        address: {
            areaName: '',
            district: '',
            state: 'Assam',
            pincode: '',
            country: 'India',
        },
        travel: {
            comingFrom: '',
            goingTo: '',
            profession: '',
            purpose: '',
        },
        idFront: null,
        idBack: null,
        fileErrors: { idFront: false, idBack: false }
    });

    const [guests, setGuests] = useState([createGuestTemplate(true)]);

    // Filter to get only available rooms
    const availableRooms = rooms.filter(room => room.status === "Not Occupied");

    // --- HELPER FUNCTIONS ---

    const addCompanion = () => {
        setGuests([...guests, createGuestTemplate(false)]);
    };

    const removeGuest = (index) => {
        setGuests(guests.filter((_, i) => i !== index));
    };

    const updateGuestField = (index, field, value) => {
        const updated = [...guests];
        updated[index][field] = value;
        setGuests(updated);
    };

    const updateNestedField = (index, category, field, value) => {
        const updated = [...guests];
        updated[index][category][field] = value;
        setGuests(updated);
    };

    const copyLeadDetails = (index) => {
        if (index === 0) return;
        const lead = guests[0];
        const updated = [...guests];
        updated[index].address = { ...lead.address };
        updated[index].travel = { ...lead.travel };
        setGuests(updated);
    };

    const handleFileChange = (e, index, side) => {
        const file = e.target.files[0];
        if (!file) return;

        const isError = file.size > 200 * 1024;
        const updated = [...guests];
        updated[index].fileErrors[side] = isError;
        updated[index][side === 'idFront' ? 'idFront' : 'idBack'] = isError ? null : file;
        setGuests(updated);
    };

    // Check if every guest has valid files and required fields
    const isFormInvalid = selectedRoom === "" || guests.some(g => g.fileErrors.idFront || g.fileErrors.idBack);

    // --- SUBMISSION ---

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validations
        const incompleteGuest = guests.find(g => g.address.pincode.length !== 6 || g.mobileNumber.length !== 10);

        if (incompleteGuest) {
            setAlert({ msg: "Please ensure all guests have 6-digit Pincode, and 10-digit Mobile Number.", type: "danger" });
            return;
        }

        setLoading(true);

        try {
            const leadId = guests[0].id;
            const allComps = guests.slice(1).map(g => ({id: g.id, name: g.name, age: g.age}));

            const finalGuestObjects = await Promise.all(guests.map(async (guest, index) => {
                const storagePath = `Customer Images/${guest.id}`;

                // Parallel upload using individual guest IDs as folder names
                const [frontUrl, backUrl] = await Promise.all([
                    uploadOrReplaceFile(null, storagePath, guest.idFront),
                    uploadOrReplaceFile(null, storagePath, guest.idBack)
                ]);

                return {
                    id: guest.id,
                    name: guest.name,
                    name_lowercase: guest.name.toLowerCase(),
                    age: guest.age,
                    mobileNumber: guest.mobileNumber,
                    guardianName: guest.guardianName,
                    guardianType: guest.guardianType === 'Other' ? guest.otherGuardian : guest.guardianType,
                    address: guest.address,
                    travel: guest.travel,
                    roomNumber: selectedRoom,
                    idCard: { front: frontUrl, back: backUrl },
                    isLead: index === 0,
                    companions: index === 0 ? allComps : [],
                    leadId: index === 0 ? null : leadId,
                    status: true, // Occupied
                };
            }));

            const selectedRoomId = availableRooms.find(room => room.roomNumber === selectedRoom)?.id;

            // Execute atomic transaction for all guests
            await checkInTransaction(finalGuestObjects, selectedRoomId);

            // Reset Form
            setGuests([createGuestTemplate(true)]);
            setSelectedRoom("");
            setAlert({ msg: `${guests.length} Guest(s) checked in successfully!`, type: "success" });

        } catch (error) {
            console.error("Check-in failed:", error);
            setAlert({ msg: "Registration failed. Check connection or console.", type: "danger" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-card">
                <div className="card-header-gold d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="mb-0">Guest Registration</h2>
                        <p className="small mb-0">Hotel Four Seasons</p>
                    </div>
                    <div className="text-end">
                        <label className="admin-label text-gold">Assign Room</label>
                        <select
                            className="form-select admin-input"
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e.target.value)}
                            required
                        >
                            <option value="">Select Room</option>
                            {availableRooms.map(room => (
                                <option key={room.id} value={room.roomNumber}>Room {room.roomNumber} ({room.name})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {guests.map((guest, index) => (
                        <div key={guest.id} className={`guest-entry-block mb-5 animate-slide-up ${index === 0 ? 'lead-border' : 'comp-border'}`}>
                            <div className="block-header d-flex justify-content-between align-items-center mb-4">
                                <h5 className="section-title-gold mb-0">
                                    {index === 0 ? <><i className="bi bi-star-fill me-2"></i>Lead Guest Details</> : `Companion Guest #${index}`}
                                </h5>
                                {index > 0 && (
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => copyLeadDetails(index)}>
                                            <i className="bi bi-copy me-1"></i> Sync with Lead
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeGuest(index)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="row g-4">
                                {/* Guest Personal Info */}
                                <div className="col-md-4">
                                    <label className="admin-label">Full Name</label>
                                    <input type="text" className="form-control admin-input" value={guest.name} onChange={(e) => updateGuestField(index, 'name', e.target.value)} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="admin-label">Age</label>
                                    <input type="text" className="form-control admin-input" value={guest.age} maxLength="3" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={(e) => updateGuestField(index, 'age', e.target.value)} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="admin-label">Mobile Number</label>
                                    <input type="text" className="form-control admin-input" value={guest.mobileNumber} maxLength="10" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={(e) => updateGuestField(index, 'mobileNumber', e.target.value)} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="admin-label">Guardian Type</label>
                                    <select className="form-select admin-input" value={guest.guardianType} onChange={(e) => updateGuestField(index, 'guardianType', e.target.value)}>
                                        <option value="Father">Father</option>
                                        <option value="Husband">Husband</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {guest.guardianType === 'Other' && (
                                    <div className="col-md-4">
                                        <label className="admin-label">Specify Relation</label>
                                        <input type="text" className="form-control admin-input" value={guest.otherGuardian} onChange={(e) => updateGuestField(index, 'otherGuardian', e.target.value)} required />
                                    </div>
                                )}
                                <div className={guest.guardianType === 'Other' ? "col-md-8" : "col-md-12"}>
                                    <label className="admin-label">Guardian Name</label>
                                    <input type="text" className="form-control admin-input" value={guest.guardianName} onChange={(e) => updateGuestField(index, 'guardianName', e.target.value)} required />
                                </div>

                                {/* Address Section for this Guest */}
                                <div className="col-12 mt-4"><h6 className="text-gold-muted small uppercase fw-bold">Address Details</h6></div>
                                <div className="col-md-3">
                                    <label className="admin-label">Area/Village</label>
                                    <input type="text" className="form-control admin-input" value={guest.address.areaName} onChange={(e) => updateNestedField(index, 'address', 'areaName', e.target.value)} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="admin-label">District</label>
                                    <input type="text" className="form-control admin-input" value={guest.address.district} onChange={(e) => updateNestedField(index, 'address', 'district', e.target.value)} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="admin-label">Pincode</label>
                                    <input type="text" className="form-control admin-input" value={guest.address.pincode} maxLength="6" onChange={(e) => updateNestedField(index, 'address', 'pincode', e.target.value)} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="admin-label">State</label>
                                    <input type="text" className="form-control admin-input" value={guest.address.state} onChange={(e) => updateNestedField(index, 'address', 'state', e.target.value)} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="admin-label">Country</label>
                                    <input type="text" className="form-control admin-input" value={guest.address.country} onChange={(e) => updateNestedField(index, 'address', 'country', e.target.value)} required />
                                </div>

                                {/* Travel Details */}
                                <div className="col-md-3">
                                    <label className="admin-label">Coming From</label>
                                    <input type="text" className="form-control admin-input" value={guest.travel.comingFrom} onChange={(e) => updateNestedField(index, 'travel', 'comingFrom', e.target.value)} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="admin-label">Going To</label>
                                    <input type="text" className="form-control admin-input" value={guest.travel.goingTo} onChange={(e) => updateNestedField(index, 'travel', 'goingTo', e.target.value)} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="admin-label">Profession</label>
                                    <input type="text" className="form-control admin-input" value={guest.travel.profession} onChange={(e) => updateNestedField(index, 'travel', 'profession', e.target.value)} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="admin-label">Purpose</label>
                                    <input type="text" className="form-control admin-input" value={guest.travel.purpose} onChange={(e) => updateNestedField(index, 'travel', 'purpose', e.target.value)} required />
                                </div>

                                {/* ID Verification */}
                                <div className="col-md-6">
                                    <div className={`upload-box ${guest.fileErrors.idFront ? 'border-danger' : ''}`}>
                                        <label className="admin-label">ID Front Side (Max 200KB)</label>
                                        <input type="file" className="form-control admin-input" accept="image/*" onChange={(e) => handleFileChange(e, index, 'idFront')} required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className={`upload-box ${guest.fileErrors.idBack ? 'border-danger' : ''}`}>
                                        <label className="admin-label">ID Back Side (Max 200KB)</label>
                                        <input type="file" className="form-control admin-input" accept="image/*" onChange={(e) => handleFileChange(e, index, 'idBack')} required />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="d-flex flex-column gap-3 mt-4 align-items-center">
                        <button type="button" className="btn btn-outline-gold w-50" onClick={addCompanion}>
                            <i className="bi bi-person-plus-fill me-2"></i>Add Companion
                        </button>

                        <button type="submit" className="btn btn-gold-admin px-5 py-3 mt-3 w-75 shadow-lg" disabled={isFormInvalid}>
                            <i className="bi bi-check2-circle me-2"></i> COMPLETE ALL CHECK-INS
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerEntry;