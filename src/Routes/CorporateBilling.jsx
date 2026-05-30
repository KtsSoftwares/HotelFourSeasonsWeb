import React, { useState, useMemo, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import CorporateInvoicePDF from '../Components/CorporateInvoicePDF';
import '../CSS/CustomerList.css'; // Reuses admin input styles
import { useFirebase } from "../Context/FirebaseContext";
import SmallLoader from '../Components/SmallLoader';
import CateringBillCard from '../Components/CateringBillCard';
import { CateringBill } from '../Models/CateringBill';
import { Bill } from '../Models/Bill';

const CorporateBilling = () => {
    const { gstData, hotelData, setAlert, saveCateringBill, getRecentCateringBills, searchCateringBillsByGst } = useFirebase();

    const [smallLoader, setSmallLoader] = useState(false);

    // Form Processing States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchGst, setSearchGst] = useState("");
    /** @type {[CateringBill[], React.Dispatch<React.SetStateAction<CateringBill[]>>]} */
    const [recentBills, setRecentBills] = useState([]);

    // Ledger List Management States
    const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    // Form inputs state
    const [clientData, setClientData] = useState({
        companyName: "",
        companyGst: "",
        companyAddress: ""
    });
    const [hallDays, setHallDays] = useState(1);
    const [soundDays, setSoundDays] = useState(1);
    const [totalGuests, setTotalGuests] = useState(120);
    const [rates, setRates] = useState({ hallPerDay: 5000, soundPerDay: 1500, mealPerPerson: 1000 });

    // Live Calculation Engine
    const billCalculations = useMemo(() => {
        const hallSubtotal = hallDays * rates.hallPerDay;
        const soundSubtotal = soundDays * rates.soundPerDay;
        const cateringSubtotal = totalGuests * rates.mealPerPerson;
        const taxableValue = hallSubtotal + soundSubtotal + cateringSubtotal;

        const foodGstPercent = gstData?.cateringGst || 5;
        const rentalGstPercent = gstData?.rentalGst || 18;

        const cateringGst = cateringSubtotal * (foodGstPercent / 100);
        const rentalGst = (hallSubtotal + soundSubtotal) * (rentalGstPercent / 100);
        const totalGst = cateringGst + rentalGst;

        const rawTotal = taxableValue + totalGst;
        const finalTotal = Math.round(rawTotal);
        const roundOff = (finalTotal - rawTotal).toFixed(2);

        return { hallSubtotal, soundSubtotal, cateringSubtotal, taxableValue, cateringGst, rentalGst, totalGst, roundOff, finalTotal };
    }, [hallDays, soundDays, totalGuests, rates]);

    // Data Loading Functions
    const loadInitialLedger = async () => {
        setSmallLoader(true);
        try {
            const { bills, lastDoc, moreAvailable } = await getRecentCateringBills(3, null);
            setRecentBills(bills);
            setLastVisibleDoc(lastDoc);
            setHasMore(moreAvailable);
        } catch (err) {
            console.error("Error fetching event records", err);
        }
        finally {
            setSmallLoader(false);
        }
    };

    const loadMoreBills = async () => {
        setSmallLoader(true);
        try {
            let response;
            if (isSearching) {
                // If we are currently looking at filtered results, paginate through the filtered stack
                response = await searchCateringBillsByGst(3, searchGst, lastVisibleDoc);
            } else {
                // Otherwise paginate through the regular historical log layout
                response = await getRecentCateringBills(3, lastVisibleDoc);
            }
            setRecentBills(prev => [...prev, ...response.bills]);
            setLastVisibleDoc(response.lastDoc);
            setHasMore(response.moreAvailable);
        } catch (err) {
            console.error("Error paginating records", err);
        }
        finally {
            setSmallLoader(false);
        }
    };

    useEffect(() => {
        loadInitialLedger();
    }, []);

    const handleSearch = async () => {
        if (!searchGst.trim()) {
            setIsSearching(false);
            loadInitialLedger(); // Reset back to showing the recent 3 items if empty
            return;
        }

        setIsSearching(true);
        setSmallLoader(true);
        try {
            const { bills, lastDoc, moreAvailable } = await searchCateringBillsByGst(3, searchGst, null);
            setRecentBills(bills);
            setLastVisibleDoc(lastDoc);
            setHasMore(moreAvailable);
        } catch (err) {
            console.error("Search query failure", err);
        }
        finally {
            setSmallLoader(false);
        }
    };

    const resetSearch = () => {
        setSearchGst("");
        setIsSearching(false);
        loadInitialLedger();
    };

    const handleSubmitAndInvoice = async (e) => {
        e.preventDefault();
        if (!clientData.companyName || !clientData.companyGst || !clientData.companyAddress) {
            setAlert({ msg: "Please complete all fields.", type: "danger" });
            return;
        }
        setIsSubmitting(true);

        try {
            const billPayload = {
                clientData,
                rates,
                inputs: { hallDays, soundDays, totalGuests },
                billCalculations
            };

            // Transactional Write to Firestore 
            const savedBillInstance = await saveCateringBill(billPayload);

            setAlert({ msg: `Invoice #${savedBillInstance.invoiceNo} successfully recorded!`, type: "success" });

            // Clear out the inputs on the dashboard layout
            setClientData({ companyName: "", companyGst: "", companyAddress: "" });

            // Auto-Refresh: Fetch the newest 3 cards immediately
            await loadInitialLedger();

            // Mount and render the final instantiated PDF model
            triggerPdfDownload(savedBillInstance);
        } catch (err) {
            setAlert({ msg: "Database synchronization dropped. Try again.", type: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateQuotation = async () => {
        if (!clientData.companyName || !clientData.companyAddress) {
            setAlert({ msg: "Please enter at least a Company Name and Address to generate a quotation.", type: "danger" });
            return;
        }

        // Building a temporary data model instance without hitting Firestore counters
        const quotationData = new CateringBill("QUOTATION-TEMP", {
            invoiceNo: "QUOTATION",
            invoiceDate: new Date(),
            clientData,
            rates,
            inputs: { hallDays, soundDays, totalGuests },
            billCalculations: {
                ...billCalculations,
                amountInWords: Bill.numberToWordsIndian(billCalculations.finalTotal)
            }
        });

        triggerPdfDownload(quotationData, true);
    };

    /**
     * @param {CateringBill} billModelInstance
     */
    const triggerPdfDownload = async (billModelInstance, isQuotation = false) => {
        const doc = <CorporateInvoicePDF hotelData={hotelData} bill={billModelInstance} isQuotation={isQuotation} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    return (
        <div className="container mt-4 pb-5">
            <div className="admin-card shadow-lg border-0 bg-dark text-light rounded">
                <div className="card-header bg-black border-bottom-gold p-4">
                    <h2 className="text-gold font-playfair mb-0">Conference & Catering Ledger</h2>
                    <p className="text-white-50 small mb-0">Generate standalone corporate invoices for corporate hall rentals and events.</p>
                </div>

                <div className="p-4">
                    {/* SECTION 1: CORPORATE BUYER INFORMATION */}
                    <h5 className="text-gold mb-3 text-uppercase small tracking-wide">1. Corporate Client Details</h5>
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <label htmlFor="catrCompanyName" className="text-white small mb-1 admin-label">Company Name</label>
                            <input
                                type="text" id="catrCompanyName" name="companyName" className="form-control admin-input" placeholder="e.g. Nuziveedu Seeds Ltd"
                                value={clientData.companyName} onChange={e => setClientData({ ...clientData, companyName: e.target.value })}
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="catrCompanyGst" className="text-white small mb-1 admin-label">Company GSTIN</label>
                            <input
                                type="text" id="catrCompanyGst" name="companyGst" className="form-control admin-input" placeholder="19AACCNxxxx..."
                                value={clientData.companyGst} onChange={e => setClientData({ ...clientData, companyGst: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="col-md-12">
                            <label htmlFor="catrCompanyAddress" className="text-white small mb-1 admin-label">Company Billing Address</label>
                            <input
                                type="text" id="catrCompanyAddress" name="companyAddress" className="form-control admin-input" placeholder="Full corporate office address..."
                                value={clientData.companyAddress} onChange={e => setClientData({ ...clientData, companyAddress: e.target.value })}
                            />
                        </div>
                    </div>

                    <hr className="bg-secondary my-4" />

                    {/* SECTION 2: DYNAMIC EVENT CONFIGURATOR (Polished for Mobile Responsiveness) */}
                    <h5 className="text-gold mb-3 text-uppercase small tracking-wide">2. Event Attendance & Scope</h5>
                    <div className="row g-4 mb-5">

                        {/* CARD 1: CONFERENCE HALL */}
                        <div className="col-md-4">
                            <div className="p-3 bg-black rounded border border-secondary h-100">
                                <label htmlFor="hallPerDay" className="text-gold small fw-bold d-block">Conference Hall Rental</label>
                                <span className="small text-white-50 d-block mb-3">Setup Rate Configuration</span>

                                {/* Editable Rate Input Wrapper */}
                                <div className="input-group mb-2 shadow-sm">
                                    <span className="input-group-text bg-dark text-gold border-secondary admin-label mb-0" style={{ minWidth: "75px" }}>Rate/Day</span>
                                    <input
                                        type="text" id="hallPerDay" min="0" name="hallPerDay" className="form-control admin-input"
                                        value={rates.hallPerDay} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={e => setRates({ ...rates, hallPerDay: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                {/* Event Metric Duration Wrapper */}
                                <div className="input-group shadow-sm">
                                    <span className="input-group-text bg-dark text-white-50 border-secondary admin-label mb-0" style={{ minWidth: "75px" }}>Duration</span>
                                    <input
                                        type="text" min="0" name="hallDays" className="form-control admin-input"
                                        value={hallDays} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={e => setHallDays(Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                    <span className="input-group-text bg-secondary text-white border-0 admin-label mb-0">Days</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: SOUND SYSTEM */}
                        <div className="col-md-4">
                            <div className="p-3 bg-black rounded border border-secondary h-100">
                                <label htmlFor="soundPerDay" className="text-gold small fw-bold d-block">Sound System Setup</label>
                                <span className="small text-white-50 d-block mb-3">Audio Rate Configuration</span>

                                <div className="input-group mb-2 shadow-sm">
                                    <span className="input-group-text bg-dark text-gold border-secondary admin-label mb-0" style={{ minWidth: "75px" }}>Rate/Day</span>
                                    <input
                                        type="text" id="soundPerDay" min="0" name="soundPerDay" className="form-control admin-input"
                                        value={rates.soundPerDay} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={e => setRates({ ...rates, soundPerDay: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="input-group shadow-sm">
                                    <span className="input-group-text bg-dark text-white-50 border-secondary admin-label mb-0" style={{ minWidth: "75px" }}>Duration</span>
                                    <input
                                        type="text" min="0" name="soundDays" className="form-control admin-input"
                                        value={soundDays} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={e => setSoundDays(Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                    <span className="input-group-text bg-secondary text-white border-0 admin-label mb-0">Days</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: CATERING SERVICES */}
                        <div className="col-md-4">
                            <div className="p-3 bg-black rounded border border-secondary h-100">
                                <label htmlFor="mealPerPerson" className="text-gold small fw-bold d-block">Catering Attendance</label>
                                <span className="small text-white-50 d-block mb-3">Hospitality Rate Configuration</span>

                                <div className="input-group mb-2 shadow-sm">
                                    <span className="input-group-text bg-dark text-gold border-secondary admin-label mb-0" style={{ minWidth: "75px" }}>Rate/Head</span>
                                    <input
                                        type="text" id="mealPerPerson" min="0" name="mealPerPerson" className="form-control admin-input"
                                        value={rates.mealPerPerson} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={e => setRates({ ...rates, mealPerPerson: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="input-group shadow-sm">
                                    <span className="input-group-text bg-dark text-white-50 border-secondary admin-label mb-0" style={{ minWidth: "75px" }}>Volume</span>
                                    <input
                                        type="text" min="0" name="totalGuests" className="form-control admin-input"
                                        value={totalGuests} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} onChange={e => setTotalGuests(Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                    <span className="input-group-text bg-secondary text-white border-0 admin-label mb-0">Heads</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: REAL-TIME INVOICE BREAKDOWN SUMMARY */}
                    <div className="row justify-content-end">
                        <div className="col-lg-5 col-md-7">
                            <div className="p-3 rounded bg-black border border-warning shadow-sm">
                                <h6 className="text-gold border-bottom border-secondary pb-2 mb-3 font-monospace">Live Statement Matrix</h6>
                                <div className="d-flex justify-content-between small mb-2">
                                    <span>Hall Subtotal:</span>
                                    <span>₹{billCalculations.hallSubtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="d-flex justify-content-between small mb-2">
                                    <span>Sound Subtotal:</span>
                                    <span>₹{billCalculations.soundSubtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="d-flex justify-content-between small mb-2">
                                    <span>Catering Subtotal:</span>
                                    <span>₹{billCalculations.cateringSubtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="d-flex justify-content-between text-white fw-bold border-top border-secondary pt-2 mb-2">
                                    <span>Taxable Value:</span>
                                    <span>₹{billCalculations.taxableValue.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="d-flex justify-content-between text-white small mb-2">
                                    <span>Rental GST ({gstData?.rentalGst || 18}%):</span>
                                    <span>₹{billCalculations.rentalGst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="d-flex justify-content-between text-white small mb-1">
                                    <span>Catering GST ({gstData?.cateringGst || 5}%):</span>
                                    <span>₹{billCalculations.cateringGst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="d-flex justify-content-between text-white small mb-2">
                                    <span>Round Off adjustment:</span>
                                    <span>{billCalculations.roundOff}</span>
                                </div>
                                <div className="d-flex justify-content-between text-gold fw-bold border-top border-warning pt-2">
                                    <span>Grand Total:</span>
                                    <span>₹{billCalculations.finalTotal.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="d-flex flex-column flex-sm-row gap-3 mt-4 justify-content-end">
                                <button
                                    type="button"
                                    className="btn btn-outline-gold fw-bold fs-6 shadow"
                                    onClick={handleGenerateQuotation}
                                >
                                    <i className="bi bi-file-earmark-text me-2"></i> GENERATE QUOTATION
                                </button>
                                <button
                                    className="btn btn-gold-admin fw-bold fs-6 shadow"
                                    onClick={handleSubmitAndInvoice} disabled={isSubmitting}
                                >
                                    {isSubmitting ? <>Generating Invoice... <SmallLoader /></> : <><i className="bi bi-file-earmark-pdf-fill me-2"></i> COMPOSITE BILL</>}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* NEW SECTION: HISTORICAL RECENT RECORDS MATRIX */}
                <div className="admin-card shadow-lg border-0 bg-dark text-light rounded p-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                        <h4 className="text-gold font-playfair mb-0">Recent Corporate Event Settlements</h4>

                        {/* GST FILTER BAR */}
                        <div className="input-group style-search w-100" style={{ maxWidth: "430px" }}>
                            <input
                                type="text" name="gstInput" className="form-control admin-input" placeholder="Search by GSTIN..."
                                value={searchGst} aria-label="Search by Client GSTIN" onChange={e => setSearchGst(e.target.value)}
                            />
                            <button className="btn btn-outline-gold px-3" onClick={handleSearch}>
                                <i className="bi bi-search"></i>
                            </button>
                            <button
                                className="btn btn-outline-secondary px-3 text-light-50" onClick={resetSearch} disabled={!isSearching} title="Reset Search" >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* THE RESPONSE RECORDS CARDS GRID */}
                    <div className="row g-3">
                        {recentBills.length > 0 ? recentBills.map(bill => (
                            <CateringBillCard key={bill.id} bill={bill} triggerPdfDownload={triggerPdfDownload} />
                        )) : (
                            <div className="text-center py-4 text-white-50">No records matching search indexes loaded.</div>
                        )}
                    </div>
                    {/* DYNAMIC PAGINATION CONTROLLER */}
                    {smallLoader ? <SmallLoader /> :
                        (hasMore && (
                            <div className="text-center mt-4">
                                <button className="btn btn-sm btn-outline-secondary px-4 py-2" onClick={loadMoreBills}>
                                    LOAD MORE OUTSTANDING CARDS
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default CorporateBilling;