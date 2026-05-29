export class GstData {
    constructor(data) {
        /** @type {number} */ this.cgst = data.cgst || 0;
        /** @type {number} */ this.sgst = data.sgst || 0;
        /** @type {number} */ this.igst = data.igst || 0;
        /** @type {number} */ this.cateringGst = data.cateringGst || 0;
        /** @type {number} */ this.rentalGst = data.rentalGst || 0;
    }
};