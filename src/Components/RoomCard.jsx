import '../CSS/RoomCard.css';
import { Room } from '../Models/Room';

/**
 * @param {{room: Room, openRoomDetails: Function}} props
 */
const RoomCard = ({ room, openRoomDetails }) => {
    return (
        <div className="col-12 col-md-6 col-lg-4">
            <div className="room-card" onClick={() => openRoomDetails(room)}>
                <div className="room-img-container">
                    <img src={room.images[0]} alt={room.name} />
                    <div className="price-tag">₹ {room.price} / Night</div>
                </div>
                <div className="room-details p-4">
                    <h4 className="text-gold">Room {room.roomNumber}</h4>
                    <h4 className="text-gold">{room.name}</h4>
                    <p className="text-white-50 small">
                        {room.features.map((feature, index) => (
                            <span key={index}>{feature}{index < room.features.length - 1 ? " • " : ""}</span>
                        ))}
                    </p>
                    <button className="btn btn-outline-gold w-100 mt-2">VIEW DETAILS</button>
                </div>
            </div>
        </div>
    );
};

export default RoomCard;