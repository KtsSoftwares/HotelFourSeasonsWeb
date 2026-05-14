import React, { useRef, useState, useMemo, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import CustomerModal from '../Components/CustomerModal';
import CheckOutModal from '../Components/CheckOutModal';
import InvoicePDF from '../Components/InvoicePDF';
import { useFirebase } from '../Context/FirebaseContext';
import { Customer } from '../Models/Customer';
import '../CSS/CustomerList.css';

const CustomerList = () => {
    const { user, getCustomersWithFilters, checkOutTransaction, setLoading, customers, setCustomers, lastDoc, setLastDoc, hasMore, setHasMore, appliedFilters, setAppliedFilters, getOrSetBill, getCompanions } = useFirebase();

    const today = useMemo(() => new Date().toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'), []);

    const initialCorpDetails = {
        companyName: "",
        companyAddress: { district: "", state: "", country: "India" },
        companyGst: ""
    }

    const isFetching = useRef(false);

    /** @type {[Customer | null, React.Dispatch<React.SetStateAction<Customer | null>>]} */
    const [selectedGuest, setSelectedGuest] = useState(null);

    /** @type {[Customer[], React.Dispatch<React.SetStateAction<Customer[]>>]} */
    const [cachedGuestAndCompanions, setCachedGuestAndCompanions] = useState([]);

    // For CheckOut
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    /** @type {[Customer | null, React.Dispatch<React.SetStateAction<Customer | null>>]} */
    const [guestForCheckout, setGuestForCheckout] = useState(null);
    const [corpDetails, setCorpDetails] = useState(initialCorpDetails);

    const [searchType, setSearchType] = useState("name"); // Default dropdown value
    const [filterValue, setFilterValue] = useState("");

    const fetchGuests = async (isNewSearch = false, forceRefresh = false, overrideType = null, overrideValue = null) => {
        if (isFetching.current) return; // To block multiple firebase calls, reduces read costs.

        isFetching.current = true;
        try {
            // If it's a new search, we clear the previous lastDoc
            const cursor = isNewSearch ? null : lastDoc;

            const currentType = overrideType || searchType;
            const currentValue = overrideValue !== null ? overrideValue : filterValue;

            let apiFilters = {
                name: currentType === "name" ? currentValue.trim() : null,
                mobile: currentType === "mobileNumber" ? currentValue.trim() : null,
                date: (currentType === "checkIn" || currentType === "checkOut") ? currentValue : null,
                dateType: (currentType === "checkIn" || currentType === "checkOut") ? currentType : "checkIn"
            };

            const { data, fromCache } = await getCustomersWithFilters(apiFilters, cursor, 10, forceRefresh);

            if (fromCache) {
                isFetching.current = false;
                return;
            }

            if (isNewSearch) {
                setCustomers(data);
                setAppliedFilters({ type: currentType, value: currentValue })
            }
            else setCustomers(prev => [...prev, ...data]);
        } catch (err) {
            console.error("Ledger Fetch Error", err);
        }
        finally {
            isFetching.current = false;
        }
    };

    useEffect(() => {
        if (customers.length > 0) {
            // RESTORE: Pull the saved type and value from Context and 
            // put them back into the local search boxes.
            setSearchType(appliedFilters.type);
            setFilterValue(appliedFilters.value);
        } else {
            fetchGuests(true);
        }
        // eslint-disable-next-line
    }, []);

    /** 
     * @param {Customer} guest 
     * @returns {Customer[]}
    */
    const fetchCompanions = async (guest) => {
        // Return the data so we can use it immediately in the calling function
        if (cachedGuestAndCompanions[0]?.id === guest.id) return cachedGuestAndCompanions;

        setCachedGuestAndCompanions([]);
        if (guest.companions.length > 0) {
            const comps = await getCompanions(guest.companions.map(c => c.id));
            const fullList = [guest, ...comps];
            setCachedGuestAndCompanions(fullList);
            return fullList;
        } else {
            const fullList = [guest];
            setCachedGuestAndCompanions(fullList);
            return fullList;
        }
    };

    /** @param {Customer} guest */
    const openCustomerModal = async (guest) => {
        await fetchCompanions(guest);
        setSelectedGuest(guest);
    };

    /** @param {Customer} guest */
    const handleInitiateCheckOut = async (guest) => {
        await fetchCompanions(guest);

        setCorpDetails(initialCorpDetails);

        setGuestForCheckout(guest);
        setShowCheckoutModal(true);
    };

    /** @param {Customer} guest */
    const handleGetBill = async (guest) => {
        const { bill, hotelData } = await getOrSetBill(guest);
        const doc = <InvoicePDF hotel={hotelData} customer={guest} bill={bill} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    /** @param {string} roomNumber */
    const checkOut = async (roomNumber) => {
        setLoading(true);
        try {
            const guestIds = cachedGuestAndCompanions.map(g => g.id);
            await checkOutTransaction(guestIds, roomNumber, corpDetails);
            setShowCheckoutModal(false);
            setGuestForCheckout(null);
            setCorpDetails(initialCorpDetails);
            fetchGuests(true, true);
        } catch (e) { console.error("Checkout error:", e); }
        finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setSearchType("name");
        setFilterValue("");
        setAppliedFilters({ type: "name", value: "" });
        fetchGuests(true, true, "name", "");
    };

    return (
        <div className="container mt-4 pb-5">
            <div className="admin-card shadow-lg border-0">
                <div className="card-header bg-dark border-bottom-gold p-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="text-gold font-playfair mb-0">Guest Ledger</h2>
                        <p className="text-white small mb-0">Hotel Four Seasons Registry (Refresh to see updated list or click Reset)</p>
                    </div>
                </div>

                <div className="p-4">
                    {/* SEARCH FILTERS */}
                    <div className="row g-3 mb-4 align-items-end">
                        <div className="col-md-3">
                            <label className="text-white small mb-1">Search By</label>
                            <select
                                className="form-select admin-input"
                                value={searchType}
                                onChange={(e) => {
                                    setSearchType(e.target.value);
                                    setFilterValue(""); // Clear previous input value on type change
                                }}
                            >
                                <option value="name">Guest Name</option>
                                <option value="mobileNumber">Mobile Number</option>
                                <option value="checkIn">Check-In Date</option>
                                <option value="checkOut">Check-Out Date</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="text-white small mb-1">Enter Details</label>
                            {(searchType === "checkIn" || searchType === "checkOut") ? (
                                <input
                                    type="date"
                                    className="form-control admin-input"
                                    min="2026-05-01"
                                    max={today}
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="form-control admin-input"
                                    placeholder={`Enter ${searchType === 'name' ? 'name' : 'number'}...`}
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                />
                            )}
                        </div>
                        <div className="col-md-5 d-flex gap-2">
                            <button className="btn btn-gold-admin px-4 flex-grow-1" onClick={() => fetchGuests(true)}>Search</button>
                            <button className="btn btn-outline-secondary px-3" onClick={resetFilters}>Reset</button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="table-responsive">
                        <table className="table table-dark table-hover text-center align-middle custom-admin-table">
                            <thead>
                                <tr>
                                    <th>Guest Info</th>
                                    <th>Room</th>
                                    <th>Check-in Date</th>
                                    <th>Status</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length > 0 ? customers.map(guest => (
                                    <tr key={guest.id}>
                                        <td data-label="Guest Info">
                                            <div className="fw-bold text-white">{guest.name}</div>
                                            <div className="text-white-50 small">{guest.mobileNumber}</div>
                                        </td>
                                        <td data-label="Room"><span className="text-gold fw-bold">#{guest.roomNumber}</span></td>
                                        <td data-label="Check-in Date">{guest.getCheckInDateString()}</td>
                                        <td data-label="Status">
                                            {guest.status ? (
                                                <button
                                                    className="btn btn-sm btn-gold-admin px-3 shadow-sm"
                                                    onClick={() => handleInitiateCheckOut(guest)}
                                                >
                                                    <i className="bi bi-box-arrow-right me-1"></i> CHECK-OUT
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-gold-admin px-3 shadow-sm"
                                                    onClick={() => handleGetBill(guest)}
                                                >
                                                    <i className="bi bi-box-arrow-right me-1"></i> GET BILL
                                                </button>
                                            )}
                                        </td>
                                        <td data-label="Action" className="text-end">
                                            <button className="btn btn-sm btn-outline-gold" onClick={() => openCustomerModal(guest)}>DETAILS</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-white-50">No guest records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* LOAD MORE BUTTON */}
                    {hasMore && (
                        <div className="text-center mt-4">
                            <button className="btn btn-outline-gold px-5" onClick={() => fetchGuests(false)}>
                                LOAD MORE GUESTS
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {showCheckoutModal && <CheckOutModal showCheckoutModal={showCheckoutModal} setShowCheckoutModal={setShowCheckoutModal} guest={guestForCheckout} corpDetails={corpDetails} setCorpDetails={setCorpDetails} checkOut={checkOut} />}
            {selectedGuest && <CustomerModal selectedGuest={selectedGuest} setSelectedGuest={setSelectedGuest} cachedGuestAndCompanions={cachedGuestAndCompanions} />}
        </div>
    );
};

export default CustomerList;