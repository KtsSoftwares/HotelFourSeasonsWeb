import { GstData } from './GstData';

export class FirebaseContextValue {
    constructor() {
        /** @type {import('./Staff').Staff | null} */
        this.staffDetails = null;

        /** @type {import('./Room').Room[]} */
        this.rooms = [];

        /** @type {import('./Customer').Customer[]} */
        this.customers = [];

        /** @type {import('./HotelData').HotelData | null} */
        this.hotelData = null;

        /** @type {import('./KtsLegacy').KtsLegacy | null} */
        this.legacyData = null;

        /** @type {import('./GstData').GstData | null} */
        this.gstData = new GstData({cgst: 0, sgst: 0, igst: 0, cateringGst: 0, rentalGst: 0});
    }
};