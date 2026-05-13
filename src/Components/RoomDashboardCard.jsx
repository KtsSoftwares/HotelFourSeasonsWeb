import '../CSS/RoomDashboardCard.css';
import { Room } from '../Models/Room';

/** @param {{ room: Room, openEditModal: Function, handleDelete: Function }} props */
const RoomDashboardCard = ({ room, openEditModal, handleDelete }) => {
    return (
        <div className="col-12 col-md-6 col-lg-4">
            <div className="room-card-premium shadow-lg">

                <div className="room-image-wrapper">
                    <img src={room.images[0]} alt={room.name} className="room-img-top" />
                    <div className="admin-controls-overlay">
                        <button className="btn btn-sm btn-light me-2" onClick={() => openEditModal(room)}>
                            <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(room.id, room.roomNumber, room.status)}>
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>

                <div className="p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="text-white fw-bold mb-0">{room.name}</h5>
                        <span className={`badge ${room.status === 'Occupied' ? 'bg-danger' : 'bg-success'}`}>
                            {room.status}
                        </span>
                    </div>

                    <div className="text-gold fw-bold mb-3">Room #{room.roomNumber} — ₹{room.price}</div>

                    <p className="text-white small">{room.description}</p>
                    <p className="text-white-50 small mt-auto mb-0">{`Current Guest Id: ${room.currentGuestId || 'None'}`}</p>
                </div>
            </div>
        </div>
    );
};

export default RoomDashboardCard;