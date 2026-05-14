/**
 * @typedef {Object} Address
 * @property {string} line1
 * @property {string} city
 * @property {string} state
 * @property {string} pin
 */
/**
 * @typedef {Object} BankDetails
 * @property {string} bankName
 * @property {string} accountHolderName
 * @property {string} accountNumber
 * @property {string} ifscCode
 */
/**
 * @typedef {Object} Images
 * @property {string} welcome
 * @property {string[]} carousal
 */

export class HotelData {
    constructor(data) {
        /** @type {string} */ this.name = data.name || "";
        /** @type {string} */ this.email = data.email || "";
        /** @type {string} */ this.gstNo = data.gstNo || "";
        /** @type {string} */ this.gstRegName = data.gstRegName || "";
        /** @type {string} */ this.sacCode = data.sacCode || "";
        /** @type {string} */ this.website = data.website || "";
        /** @type {string[]} */ this.contactNumbers = data.contactNumbers || [];
        /** @type {number} */ this.startYear = data.startYear || 2026;

        const addr = data.address || {};
        /** @type {Address} */ this.address = {
            line1: addr.line1 || "",
            city: addr.city || "",
            state: addr.state || "",
            pin: addr.pin || ""
        };

        const imgs = data.images || {};
        /** @type {Images} */ this.images = {
            welcome: imgs.welcome || "https://via.placeholder.com/150?text=No+Image",
            carousal: imgs.carousal.length > 0 ? imgs.carousal.map(img => img || "https://via.placeholder.com/150?text=No+Image") : ["https://via.placeholder.com/150?text=No+Image"]
        };

        const bank = data.bankDetails || {};
        /** @type {BankDetails} */ this.bankDetails = {
            bankName: bank.bankName || "",
            accountHolderName: bank.accountHolderName || "",
            accountNumber: bank.accountNumber || "",
            ifscCode: bank.ifscCode || ""
        };
    }
};