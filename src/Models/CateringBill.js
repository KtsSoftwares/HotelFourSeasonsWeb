/**
 * @typedef {Object} ClientData
 * @property {string} companyName
 * @property {string} companyGst
 * @property {string} companyAddress
 */
/**
 * @typedef {Object} Rates
 * @property {number} hallPerDay
 * @property {number} soundPerDay
 * @property {number} mealPerPerson
 */
/**
 * @typedef {Object} Inputs
 * @property {number} hallDays
 * @property {number} soundDays
 * @property {number} totalGuests
 */
/**
 * @typedef {Object} BillCalculations
 * @property {number} hallSubtotal
 * @property {number} soundSubtotal
 * @property {number} cateringSubtotal
 * @property {number} taxableValue
 * @property {number} cateringGst
 * @property {number} rentalGst
 * @property {number} totalGst
 * @property {string} roundOff
 * @property {number} finalTotal
 * @property {string} amountInWords
 */

export class CateringBill {
    constructor(id, data = {}) {
        /** @type {string} */ this.id = id;
        /** @type {string} */ this.invoiceNo = data.invoiceNo || "";
        // Handle Firestore Timestamp conversion smoothly
        /** @type {Date} */ this.invoiceDate = data.invoiceDate?.seconds 
            ? new Date(data.invoiceDate.seconds * 1000) 
            : data.invoiceDate ? new Date(data.invoiceDate) : new Date();
        
        const cData = data.clientData || {};
        /** @type {ClientData} */ this.clientData = {
            companyName: cData.companyName || "",
            companyGst: cData.companyGst || "",
            companyAddress: cData.companyAddress || ""
        };
        
        const rates = data.rates || {};
        /** @type {Rates} */ this.rates = {
            hallPerDay: rates.hallPerDay || 0,
            soundPerDay: rates.soundPerDay || 0,
            mealPerPerson: rates.mealPerPerson || 0
        };
        
        const inputs = data.inputs || {};
        /** @type {Inputs} */ this.inputs = {
            hallDays: inputs.hallDays || 0,
            soundDays: inputs.soundDays || 0,
            totalGuests: inputs.totalGuests || 0
        };
        
        const billCalculations = data.billCalculations || {};
        /** @type {BillCalculations} */ this.billCalculations = {
            hallSubtotal: billCalculations.hallSubtotal || 0,
            soundSubtotal: billCalculations.soundSubtotal || 0,
            cateringSubtotal: billCalculations.cateringSubtotal || 0,
            taxableValue: billCalculations.taxableValue || 0,
            cateringGst: billCalculations.cateringGst || 0,
            rentalGst: billCalculations.rentalGst || 0,
            totalGst: billCalculations.totalGst || 0,
            roundOff: billCalculations.roundOff || "0.00",
            finalTotal: billCalculations.finalTotal || 0,
            amountInWords: billCalculations.amountInWords || ""
        };
    }

    // Formats dates uniformly across cards and React-PDF Template
    getInvoiceDateString() {
        return this.invoiceDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
}