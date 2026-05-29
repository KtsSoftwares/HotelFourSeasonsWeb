import { Timestamp } from "firebase/firestore";

/**
 * @typedef {Object} Address
 * @property {string} areaName
 * @property {string} district
 * @property {string} state
 * @property {string} pincode
 * @property {string} country
 */
/**
 * @typedef {Object} Travel
 * @property {string} comingFrom
 * @property {string} goingTo
 * @property {string} profession
 * @property {string} purpose
 */
/**
 * @typedef {Object} IdCard
 * @property {string} front
 * @property {string} back
 */
/**
 * @typedef {Object} Companion
 * @property {string} id
 * @property {string} name
 * @property {string} age
 * @property {string} mobileNumber
 */

export class Customer {
    constructor(id, data) {
        /** @type {string} */ this.id = id;
        /** @type {string} */ this.name = data.name;
        /** @type {string} */ this.name_lowercase = data.name_lowercase;
        /** @type {string} */ this.age = data.age;
        /** @type {string} */ this.mobileNumber = data.mobileNumber;
        /** @type {string} */ this.guardianType = data.guardianType;
        /** @type {string} */ this.guardianName = data.guardianName;
        
        const addr = data.address || {};
        /** @type {Address} */ this.address = {
            areaName: addr.areaName || "",
            district: addr.district || "",
            state: addr.state || "",
            pincode: addr.pincode || "",
            country: addr.country || ""
        };
        
        const trav = data.travel || {};
        /** @type {Travel} */ this.travel = {
            comingFrom: trav.comingFrom || "",
            goingTo: trav.goingTo || "",
            profession: trav.profession || "",
            purpose: trav.purpose || ""
        };

        const idcardObj = data.idCard || {};
        /** @type {IdCard} */ this.idCard = {
            front: idcardObj.front,
            back: idcardObj.back
        };

        /** @type {string | null} */ this.companyName = data.companyName || null;
        const compAddr = data.companyAddress || {};
        /** @type {Address} */ this.companyAddress = {
            district: compAddr.district || "",
            state: compAddr.state || "",
            country: compAddr.country || ""
        };
        /** @type {string | null} */ this.companyGst = data.companyGst || null;
        
        /** @type {string} */ this.roomNumber = data.roomNumber;
        /** @type {string} */ this.leadId = data.leadId || null;
        /** @type {boolean} */ this.isLead = data.isLead;
        /** @type {boolean} */ this.status = data.status;
        
        /** @type {Companion[]} */ this.companions = data.companions || [];

        /** @type {Timestamp} */ this.checkIn = data.checkIn;
        /** @type {Timestamp} */ this.checkOut = data.checkOut || null;
        /** @type {string} */ this.checkedInBy = data.checkedInBy;
        /** @type {string} */ this.checkedOutBy = data.checkedOutBy || null;
    }

    getCheckInDateString() {
        if (!this.checkIn) return "N/A";
        return new Date(this.checkIn.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: "2-digit", minute: "2-digit", hour12: true });
    }

    getCheckOutDateString() {
        if (!this.checkOut) return "N/A";
        return new Date(this.checkOut.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: "2-digit", minute: "2-digit", hour12: true });
    }
};