import { Timestamp } from "firebase/firestore";

/**
 * @typedef {Object} Address
 * @property {string} careOf
 * @property {string} location
 * @property {string} vtc
 * @property {string} subDistrict
 * @property {string} district
 * @property {string} state
 * @property {string} pincode
 * @property {string} country
 */

export class Staff {
    constructor(id, data) {
        /** @type {string} */ this.uid = id;
        /** @type {string} */ this.firstName = data.firstName;
        /** @type {string} */ this.lastName = data.lastName;
        /** @type {string} */ this.dob = data.dob;
        /** @type {string} */ this.gender = data.gender;
        /** @type {string} */ this.phoneNumber = data.phoneNumber;

        const addr = data.address || {};
        /** @type {Address} */ this.address = {
            careOf: addr.careOf || "",
            location: addr.location || "",
            vtc: addr.vtc || "",
            subDistrict: addr.subDistrict || "",
            district: addr.district || "",
            state: addr.state || "",
            pincode: addr.pincode || "",
            country: addr.country || ""
        };

        /** @type {boolean} */ this.hasAccess = !!data.hasAccess;
        /** @type {boolean} */ this.isAdmin = !!data.isAdmin;
        /** @type {boolean} */ this.resigned = !!data.resigned;
        /** @type {string} */ this.photoURL = data.photoURL;

        /** @type {Timestamp} */ this.createdAt = data.createdAt;
        /** @type {Timestamp} */ this.lastUpdatedAt = data.lastUpdatedAt;
    }

    getJoinDateString() {
        if (!this.createdAt) return "N/A";
        return new Date(this.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: "2-digit", minute: "2-digit", hour12: true });
    }

    getlastUpdatedAtString() {
        if (!this.lastUpdatedAt) return "N/A";
        return new Date(this.lastUpdatedAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    }
};