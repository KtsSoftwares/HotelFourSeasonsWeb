import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../CSS/CustomerEntry.css';
import { useFirebase } from '../Context/FirebaseContext';
import { Customer } from '../Models/Customer';
import SmallLoader from '../Components/SmallLoader';

const CustomerEntry = () => {
    const { searchCustomersForEntry } = useFirebase();

    const location = useLocation();
    const { rooms, uploadOrReplaceFile, setLoading, setAlert, getPreDocumentId, checkInTransaction } = useFirebase();
    const [selectedRoom, setSelectedRoom] = useState("");

    const [smallLoader, setSmallLoader] = useState(false);
    const [searchingIndex, setSearchingIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    /** @type {[Customer[], React.Dispatch<React.SetStateAction<Customer[]>>]} */
    const [searchResults, setSearchResults] = useState([]);

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

    useEffect(() => {
        // Check if there is re-entry data coming from the Customer modal
        if (location.state?.reEntryData) {
            const incomingGuests = location.state.reEntryData;

            window.history.replaceState({}, document.title);

            // Map the existing data into the form structure
            const populatedGuests = incomingGuests.map((guest, index) => ({
                // CRITICAL: Generate a FRESH ID for this new check-in record
                id: getPreDocumentId("customers"),
                isLead: index === 0,
                name: guest.name || '',
                age: guest.age || '',
                mobileNumber: guest.mobileNumber || '',
                guardianName: guest.guardianName || '',
                guardianType: ['Father', 'Husband', 'Mother'].includes(guest.guardianType)
                    ? guest.guardianType : 'Other',
                otherGuardian: !['Father', 'Husband', 'Mother'].includes(guest.guardianType)
                    ? guest.guardianType : '',
                address: { ...guest.address },
                travel: { ...guest.travel },
                // Keep the existing ID URLs so we don't have to re-upload
                idFront: guest.idCard.front,
                idBack: guest.idCard.back,
                fileErrors: { idFront: false, idBack: false }
            }));

            setGuests(populatedGuests);

            // If the original guest had a room assigned, we can clear it 
            // to force the staff to pick a new available room for this stay.
            setSelectedRoom("");
        }
    }, []);

    const handleSearchGuest = async () => {
        if (!searchTerm.trim()) return;
        setSmallLoader(true);
        try {
            // This now hits EVERY document in the customer collection
            const data = await searchCustomersForEntry(searchTerm.trim());
            setSearchResults(data);
        } finally {
            setSmallLoader(false);
        }
    };

    /**
     * @param {number} index
     * @param {Customer} selectedGuest
     */
    const selectReturningGuest = (index, selectedGuest) => {
        const updated = [...guests];

        // We update the specific companion block at 'index'
        updated[index] = {
            ...updated[index], // Keep the FRESH ID we just created for this stay
            name: selectedGuest.name,
            age: selectedGuest.age,
            mobileNumber: selectedGuest.mobileNumber,
            guardianName: selectedGuest.guardianName,
            guardianType: selectedGuest.guardianType,
            address: { ...selectedGuest.address },
            travel: { ...selectedGuest.travel },
            idFront: selectedGuest.idCard.front,
            idBack: selectedGuest.idCard.back,
            fileErrors: { idFront: false, idBack: false }
        };

        setGuests(updated);
        setSearchingIndex(null); // Close the search modal/overlay
        setSearchTerm("");
    };

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
    const isFormInvalid = selectedRoom === "" || guests.some(g => g.fileErrors.idFront || g.fileErrors.idBack || !g.idFront || !g.idBack);

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
            const allComps = guests.slice(1).map(g => ({ id: g.id, name: g.name, age: g.age }));

            const finalGuestObjects = await Promise.all(guests.map(async (guest, index) => {
                const storagePath = `Customer Images/${guest.id}`;

                // Parallel upload using individual guest IDs as folder names
                const [frontUrl, backUrl] = await Promise.all([
                    typeof guest.idFront === 'string' ? guest.idFront : uploadOrReplaceFile(null, storagePath, guest.idFront),
                    typeof guest.idBack === 'string' ? guest.idBack : uploadOrReplaceFile(null, storagePath, guest.idBack)
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

            setAlert({ msg: `${guests.length} Guest(s) checked in successfully!`, type: "success" });
            // Reset Form
            resetForm();
        } catch (error) {
            console.error("Check-in failed:", error);
            setAlert({ msg: "Registration failed. Check connection or console.", type: "danger" });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setGuests([createGuestTemplate(true)]);
        setSelectedRoom("");
    };

    return (
        <div className="admin-container">
            <div className="admin-card">
                <div className="card-header-gold d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div>
                        <h2 className="mb-0">Guest Registration</h2>
                        <p className="small mb-0">Hotel Four Seasons</p>
                    </div>
                    <div className='d-flex align-items-end gap-2 w-md-auto'>
                        <div className='flex-grow-1'>
                            <label className="admin-label text-gold">Assign Room</label>
                            <select
                                className="form-select admin-input"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                required >
                                <option value="">Select Room</option>
                                {availableRooms.map(room => (<option key={room.id} value={room.roomNumber}>Room {room.roomNumber} ({room.name})</option>))}
                            </select>
                        </div>
                        <div className='flex-shrink-0'>
                            <button type="button" className="btn btn-sm btn-outline-warning text-nowrap" style={{ height: '42px' }} onClick={resetForm}>
                                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Form
                            </button>
                        </div>
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
                                        <button type="button" className="btn btn-sm btn-outline-warning" title='Copy Lead Details' onClick={() => copyLeadDetails(index)}>
                                            <i className="bi bi-copy me-1"></i>
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" title='Remove Guest' onClick={() => removeGuest(index)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="row g-4">
                                {/* Guest Personal Info */}
                                <div className="col-md-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="admin-label mb-0">Full Name</label>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-link text-gold p-0 text-decoration-none"
                                            onClick={() => setSearchingIndex(index)} >
                                            <i className="bi bi-search me-1"></i> Returning Guest?
                                        </button>
                                    </div>
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
                                    {typeof guest.idFront === 'string' && (
                                        <div className="text-success small mt-1">
                                            <i className="bi bi-check-circle-fill"></i> Previous ID Linked
                                        </div>
                                    )}
                                    <div className={`upload-box ${guest.fileErrors.idFront ? 'border-danger' : ''}`}>
                                        <label className="admin-label">ID Front Side (Max 200KB)</label>
                                        <input type="file" className="form-control admin-input" accept="image/*" onChange={(e) => handleFileChange(e, index, 'idFront')} required={!guest.idFront} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    {typeof guest.idBack === 'string' && (
                                        <div className="text-success small mt-1">
                                            <i className="bi bi-check-circle-fill"></i> Previous ID Linked
                                        </div>
                                    )}
                                    <div className={`upload-box ${guest.fileErrors.idBack ? 'border-danger' : ''}`}>
                                        <label className="admin-label">ID Back Side (Max 200KB)</label>
                                        <input type="file" className="form-control admin-input" accept="image/*" onChange={(e) => handleFileChange(e, index, 'idBack')} required={!guest.idBack} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="d-flex flex-column gap-3 mt-4 align-items-center">
                        <button type="button" className="btn btn-outline-gold w-50 mobile-width" onClick={addCompanion}>
                            <i className="bi bi-person-plus-fill me-2"></i>Add Companion
                        </button>

                        <button type="submit" className="btn btn-gold-admin p-3 mt-3 w-75 shadow-lg mobile-width" disabled={isFormInvalid}>
                            <i className="bi bi-check2-circle me-2"></i> COMPLETE ALL CHECK-INS
                        </button>
                    </div>
                </form>
            </div>
            {/* SEARCH OVERLAY */}
            {searchingIndex !== null && (
                <div className="custom-modal-overlay d-flex align-items-center justify-content-center">
                    <div className="admin-card p-4 w-75 mw-600 animate-slide-up border-gold shadow-2xl bg-dark-deep">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="text-gold font-playfair mb-0">Find Returning Guest</h4>
                            <button className="btn-close btn-close-white" onClick={() => setSearchingIndex(null)}></button>
                        </div>

                        <div className="input-group mb-4">
                            <input
                                type="text"
                                className="form-control admin-input"
                                placeholder="Type name to search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn btn-gold-admin px-4" onClick={handleSearchGuest}>
                                <i className="bi bi-search"></i>
                            </button>
                        </div>

                        <div className="search-results-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {smallLoader && <SmallLoader />}
                            {searchResults.length > 0 ? (
                                searchResults.map(res => (
                                    <div
                                        key={res.id}
                                        className="result-item p-3 mb-2 border border-secondary rounded d-flex justify-content-between align-items-center"
                                        onClick={() => selectReturningGuest(searchingIndex, res)} style={{ cursor: "pointer" }} >
                                        <div>
                                            <h6 className="text-white mb-0">{res.name}</h6>
                                            <p className="text-white-50 small mb-0">
                                                <i className="bi bi-phone me-1"></i> {res.mobileNumber} |
                                                <i className="bi bi-geo-alt ms-2 me-1 text-wrap"></i> {res.address.district}
                                            </p>
                                            <span className="badge bg-dark-gold mt-1 text-wrap">Last Visit: {res.getCheckInDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : <p className="text-center text-white-50 py-4">No matching records found in database.</p>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerEntry;