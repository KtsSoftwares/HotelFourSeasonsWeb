export class KtsLegacy {
    constructor(data) {
        /** @type {string} */ this.title = data.title || "";
        /** @type {string[]} */ this.paragraphs = data.paragraphs || [];
        /** @type {string} */ this.quote = data.quote || "";
        /** @type {string} */ this.image = data.image || "https://via.placeholder.com/150?text=No+Image";
        /** @type {string} */ this.activeYears = data.activeYears || "";
        /** @type {string} */ this.activeCenters = data.activeCenters || "";
    }
};