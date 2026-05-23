import React, { useState, useMemo } from 'react';
import '../CSS/MonthlyReport.css';
import { useFirebase } from '../Context/FirebaseContext';
import { Bill } from '../Models/Bill';
import { Timestamp } from 'firebase/firestore';
import { exportToExcel } from '../Utils/ExcelUtils';

const MonthlyReport = () => {
    const { hotelData, reportData, fetchReport } = useFirebase();
    const today = useMemo(() => new Date());
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth - 1);
    const [excelLoading, setExcelLoading] = useState(false);

    // Dynamic Year List based on Hotel's startYear
    const years = [];
    const startYear = hotelData?.startYear || 2026;
    for (let y = startYear; y <= currentYear; y++) years.push(y);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const isFutureSelection = selectedYear === currentYear && selectedMonth > currentMonth;

    const handleGenerateClick = () => {
        if (reportData.month === selectedMonth && reportData.year === selectedYear) {
            console.log("Data already loaded for this period.");
            return;
        }
        fetchReport(selectedMonth, selectedYear);
    };

    const generateExcel = async () => {
        setExcelLoading(true);
        if (hotelData && reportData.reports && reportData.reports.length > 0) await exportToExcel(hotelData, reportData, months);
        setExcelLoading(false);
    };

    return (
        <div className="container mt-4 p-0 pb-5 d-flex flex-column justify-content-center align-items-center report-container">

            <div className="border-bottom-gold p-3 w-100">
                <h2 className="report-title font-playfair mb-2">Monthly Report</h2>
                <p className='text-white small mb-0'>Check Monthly Reports & Download Excel file</p>
            </div>

            {/* 1. Filter Section */}
            <div className="filter-bar w-100 row g-3 justify-content-center align-items-end">
                <div className="col-12 col-md-4 col-lg-3">
                    <div className="input-group-custom">
                        <label>Select Year</label>
                        <select className="form-select admin-input" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="col-12 col-md-4 col-lg-3">
                    <div className="input-group-custom">
                        <label>Select Month</label>
                        <select className="form-select admin-input" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                            {months.map((m, i) => {
                                // Disable months that are in the future for the current year
                                const isFutureMonth = selectedYear === currentYear && i > currentMonth;

                                return (
                                    <option key={m} value={i} disabled={isFutureMonth}>
                                        {m}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="col-12 col-md-4 col-lg-2">
                    <button className="btn btn-generate w-100" onClick={handleGenerateClick} disabled={isFutureSelection} style={{ opacity: isFutureSelection ? 0.5 : 1 }}>{isFutureSelection ? "Invalid Date" : "Generate"}</button>
                </div>
            </div>

            {/* 2. Data Preview Table */}
            <div className="table-responsive w-100" style={{ background: "#1A1A1B", borderRadius: "8px", border: "1px solid #333" }}>
                {reportData?.reports && reportData?.reports?.length > 0 ?
                    (
                        <>
                            <table className="report-table table text-center align-middle">
                                <thead>
                                    <tr>
                                        <th>Invoice Date</th>
                                        <th>Invoice No.</th>
                                        <th>GSTIN</th>
                                        <th>Party Name</th>
                                        <th>Invoice Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData?.reports?.map((bill) => (
                                        <tr key={bill.id}>
                                            <td data-label="Invoice Date">{bill.getBillDateString()}</td>
                                            <td data-label="Invoice No.">{bill.invoiceNo}</td>
                                            <td data-label="GSTIN">{bill.gstNo}</td>
                                            <td data-label="Party Name">{bill.partyName}</td>
                                            <td data-label="Invoice Value" className="bold-text">₹{bill.amount.totalAmount}/-</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="export-footer d-flex justify-content-end mt-4">
                                <button className="btn btn-excel" onClick={generateExcel} disabled={excelLoading}>{excelLoading ? 'Processing...' : 'Download Excel (.xlsx)'}</button>
                            </div>
                        </>
                    ) : <div className="text-white text-center py-4">No bills found for this period.</div>
                }
            </div>
        </div>
    );
};

export default MonthlyReport;