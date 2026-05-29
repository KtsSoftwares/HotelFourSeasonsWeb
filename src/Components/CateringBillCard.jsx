import { CateringBill } from "../Models/CateringBill";

/**
 * @param {{bill: CateringBill, triggerPdfDownload: Function}} props
 */
const CateringBillCard = ({ bill, triggerPdfDownload }) => {
    return (
        <div className="col-md-4">
            <div className="p-3 bg-black rounded border border-secondary d-flex flex-column justify-content-between h-100">
                <div>
                    <div className="d-flex justify-content-between border-bottom border-secondary pb-2 mb-2">
                        <span className="text-gold">Inv #{bill.invoiceNo}</span>
                        <span className="text-white-50 small">{bill.getInvoiceDateString()}</span>
                    </div>
                    <h6 className="text-white mb-1 text-truncate">{bill.clientData.companyName}</h6>
                    <span className="text-white-50 small d-block mb-2 font-monospace">GST: <span className="text-white">{bill.clientData.companyGst}</span></span>
                    <div className="small text-white-50 mb-1">Guests: <strong className="text-white">{bill.inputs.totalGuests} Heads</strong></div>
                    <div className="small text-white-50">Total Amount: <strong className="text-warning">₹{bill.billCalculations.finalTotal.toLocaleString('en-IN')}</strong></div>
                </div>
                <button
                    className="btn btn-sm btn-outline-gold w-100 mt-3"
                    onClick={() => triggerPdfDownload(bill)}
                >
                    <i className="bi bi-printer me-1"></i> Regenerate PDF
                </button>
            </div>
        </div>
    );
};

export default CateringBillCard;