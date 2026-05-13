export class GstData {
    constructor(data) {
        /** @type {number} */ this.cgst = data.cgst || 0;
        /** @type {number} */ this.sgst = data.sgst || 0;
        /** @type {number} */ this.igst = data.igst || 0;
    }
};