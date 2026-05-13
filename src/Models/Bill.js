import { Customer } from "./Customer";
import { GstData } from "./GstData";
import { Timestamp } from "firebase/firestore";

/**
 * @typedef {Object} Amount
 * @property {number} rate
 * @property {number} cgstPercent
 * @property {number} sgstPercent
 * @property {number} igstPercent
 * @property {number} cgstAmount
 * @property {number} sgstAmount
 * @property {number} igstAmount
 * @property {number} subTotalAmount
 * @property {number} totalAmount
 * @property {string} amountInWords
 */

export class Bill {
    constructor(id, data = {}) {
        /** @type {string} */ this.id = id;
        /** @type {string} */ this.invoiceNo = data.invoiceNo || "";
        /** @type {string} */ this.gstNo = data.gstNo || "";
        /** @type {string} */ this.partyName = data.partyName || "";
        /** @type {Timestamp} */ this.billDate = data.billDate || null;
        /** @type {number} */ this.daysStayed = data.daysStayed || 0;

        const amt = data.amount || {};
        /** @type {Amount} */ this.amount = {
            rate: amt.rate || 0,
            cgstPercent: amt.cgstPercent || 0,
            sgstPercent: amt.sgstPercent || 0,
            igstPercent: amt.igstPercent || 0,
            cgstAmount: amt.cgstAmount || 0,
            sgstAmount: amt.sgstAmount || 0,
            igstAmount: amt.igstAmount || 0,
            subTotalAmount: amt.subTotalAmount || 0,
            totalAmount: amt.totalAmount || 0,
            amountInWords: amt.amountInWords || ""
        };
    }

    getBillDateString() {
        if (!this.billDate) return "N/A";
        return new Date(this.billDate.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    toFirestore() {
        return { id: this.id, invoiceNo: this.invoiceNo, billDate: this.billDate, daysStayed: this.daysStayed, amount: this.amount };
    }

    static getFinancialYear() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // Jan is 0

        // If month is April (4) or later, FY is currentYear to nextYear
        // If month is Jan-Mar, FY is prevYear to currentYear
        const startYear = currentMonth >= 4 ? currentYear : currentYear - 1;
        const endYear = (startYear + 1).toString().slice(-2); // Get last 2 digits

        return `${startYear.toString().slice(-2)}-${endYear}`;
    };

    /**
     * @param {string} currentFY - Current Financial year string.
     * @param {number} sequenceNumber - The next number from DB (e.g., 1, 2, 3)
     */
    static generateInvoiceNo(currentFY, sequenceNumber) {
        const prefix = "HFS";

        // Pad the number with leading zeros (e.g., 1 becomes 0001)
        const paddedNumber = sequenceNumber.toString().padStart(4, '0');

        return `${prefix} / ${currentFY} / ${paddedNumber}`;
    };

    /**
     * @private
     * Days stayed calculation.
     * 12 PM Checkout/Check-in Grace Period.
     * @param {number} arrivalSeconds - Firestore timestamp in seconds.
     * @param {number} checkoutSeconds - Firestore timestamp in seconds.
     * @returns {number} - Total taxable days stayed.
     */
    static #calculateDaysStayedIST(arrivalSeconds, checkoutSeconds) {
        const arrivalDate = new Date(arrivalSeconds * 1000);
        const checkoutDate = new Date(checkoutSeconds * 1000);

        const getISTPart = (date, options) => {
            return new Intl.DateTimeFormat('en-IN', {
                ...options,
                timeZone: 'Asia/Kolkata'
            }).format(date);
        };

        const arrivalHour = parseInt(getISTPart(arrivalDate, { hour: 'numeric', hour12: false }));
        const checkoutHour = parseInt(getISTPart(checkoutDate, { hour: 'numeric', hour12: false }));
        const checkoutMinute = parseInt(getISTPart(checkoutDate, { minute: 'numeric' }));

        const arrivalDateStr = getISTPart(arrivalDate, { year: 'numeric', month: 'numeric', day: 'numeric' });
        const checkoutDateStr = getISTPart(checkoutDate, { year: 'numeric', month: 'numeric', day: 'numeric' });

        // Updated to 12 PM
        const twelvePM = 12;
        let daysStayed = 1;

        // 1. Same Day Logic
        if (arrivalDateStr === checkoutDateStr) {
            if (checkoutHour < twelvePM || (checkoutHour === twelvePM && checkoutMinute === 0)) return daysStayed;
        }

        // 2. Early Check-in (Before 12 PM IST)
        if (arrivalHour < twelvePM) daysStayed++;

        // 3. Difference in full days
        const parseDate = (dateStr) => {
            const [d, m, y] = dateStr.split('/');
            return new Date(y, m - 1, d);
        };
        const diffInTime = parseDate(checkoutDateStr).getTime() - parseDate(arrivalDateStr).getTime();
        const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

        daysStayed += (diffInDays - 1);

        // 4. Late Check-out (After 12 PM IST)
        if (checkoutHour > twelvePM || (checkoutHour === twelvePM && checkoutMinute > 0)) daysStayed++;

        return Math.max(daysStayed, 1);
    };

    /** 
     * @private
     * Convert number to words of Indian currency.
     * @param {number} num - To convert the number into words.
     * @returns {string} - The amount in words in Indian Currency format.
    */
    static #numberToWordsIndian(num) {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const format = (n, suffix) => {
            if (n === 0) return '';
            if (n > 19) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : " ") + suffix;
            return a[n] + suffix;
        };

        let words = '';
        words += format(Math.floor(num / 10000000), 'crore ');
        words += format(Math.floor((num / 100000) % 100), 'lakh ');
        words += format(Math.floor((num / 1000) % 100), 'thousand ');
        words += format(Math.floor((num / 100) % 10), 'hundred ');

        if (num > 100 && num % 100 !== 0) words += 'and ';
        words += format(Math.floor(num % 100), '');

        return words.trim() + " only";
    };

    /**
     * @param {Customer} guest
     * @param {number} rate
     * @param {GstData} gst
     * @param {string} hotelState
     * @returns {Bill}
     */
    static prepareBill(guest, rate, gst, hotelState) {
        const days = Bill.#calculateDaysStayedIST(guest.checkIn.seconds, guest.checkOut.seconds);
        
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        const subTotal = rate * days;
        if (guest.companyAddress.state.toLowerCase() === hotelState.toLowerCase()){
            cgst = (subTotal * gst.cgst) / 100;
            sgst = (subTotal * gst.sgst) / 100;
        } else igst = (subTotal * gst.igst) / 100;

        const finalGST = cgst + sgst + igst;
        const finalTotal = Math.round(subTotal + finalGST);

        return new Bill(guest.id, {
            daysStayed: days,
            gstNo: guest.companyGst,
            partyName: guest.companyName,
            amount: {
                rate: rate,
                cgstPercent: gst.cgst,
                sgstPercent: gst.sgst,
                igstPercent: gst.igst,
                cgstAmount: cgst,
                sgstAmount: sgst,
                igstAmount: igst,
                subTotalAmount: subTotal,
                totalAmount: finalTotal,
                amountInWords: Bill.#numberToWordsIndian(finalTotal)
            }
        });
    }
};