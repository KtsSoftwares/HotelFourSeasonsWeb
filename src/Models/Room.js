export class Room {
    constructor(id, data) {
        /** @type {string} */ this.id = id;
        /** @type {string} */ this.roomNumber = data.roomNumber;
        /** @type {string} */ this.name = data.name;
        /** @type {number} */ this.price = data.price;
        /** @type {string[]} */ this.features = data.features;
        /** @type {string[]} */ this.images = data.images;
        /** @type {string} */ this.description = data.description;
        /** @type {string} */ this.status = data.status;
        /** @type {string} */ this.currentGuestId = data.currentGuestId;
    }
};