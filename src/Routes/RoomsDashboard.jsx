import React, { useEffect, useState } from 'react';
import { useFirebase } from '../Context/FirebaseContext';
import '../CSS/RoomsDashboard.css';
import RoomDashboardCard from '../Components/RoomDashboardCard';
import RoomModal from '../Components/RoomModal';
import { Room } from '../Models/Room';

const RoomsDashboard = () => {
    // This would eventually be your fetched state
    /*const [rooms, setRooms] = useState([
        {
            id: "dbId_101",
            roomNumber: "101",
            name: "Deluxe Gold Suite",
            price: "1500",
            features: ["King Bed", "Plywood Finishes", "City View"],
            description: "A luxury experience featuring our signature shiny gold accents and custom handcrafted plywood furniture.",
            images: ["https://via.placeholder.com/400x250?text=Gold+Suite+1", "https://via.placeholder.com/400x250", "https://via.placeholder.com/400x250"],
            status: 'Occupied',
            currentGuestId: 'guest_001'
        },
        {
            id: "dbId_102",
            roomNumber: "102",
            name: "Deluxe Silver Suite",
            price: "2000",
            features: ["Queen Bed", "Wooden Finishes", "Mountain View"],
            description: "A sophisticated retreat with elegant wooden furnishings and breathtaking mountain vistas.",
            images: ["https://via.placeholder.com/400x250?text=Silver+Suite+1", "https://via.placeholder.com/400x250", "https://via.placeholder.com/400x250"],
            status: 'Occupied',
            currentGuestId: 'guest_002'
        },
        {
            id: "dbId_103",
            roomNumber: "103",
            name: "Deluxe Bronze Suite",
            price: "1000",
            features: ["Twin Beds", "Fabric Upholstery", "Pool View"],
            description: "A cozy yet luxurious space with comfortable twin beds and a stunning poolside view.",
            images: ["https://via.placeholder.com/400x250?text=Bronze+Suite+1", "https://via.placeholder.com/400x250", "https://via.placeholder.com/400x250"],
            status: 'Not Occupied',
            currentGuestId: null
        }
    ]);*/

    const { rooms, saveRoom, deleteStorageFolder, deleteRoom, setLoading, setAlert } = useFirebase();

    /** @type {[{isOpen: boolean, roomToEdit: Room | null}, React.Dispatch<React.SetStateAction<{isOpen: boolean, roomToEdit: Room | null}>>]} */
    const [modalConfig, setModalConfig] = useState({ isOpen: false, roomToEdit: null });

    const openAddModal = () => setModalConfig({ isOpen: true, roomToEdit: null });

    const openEditModal = (room) => setModalConfig({ isOpen: true, roomToEdit: room });

    const handleSaveRoom = async (roomData) => {
        await saveRoom(roomData);
    };

    const handleDelete = async (id, roomNumber, status) => {
        if (window.confirm(`Are you sure you want to delete Room ${roomNumber}? This will also delete all its images.`)) {
            try {
                if (status === 'Occupied') {
                    setAlert({ msg: "Cannot delete an occupied room. Please check out the current guest before deleting.", type: "danger" });
                    return;
                }
                setLoading(true);
                const folderPath = `Room Images/${roomNumber}`;
                await deleteStorageFolder(folderPath);
                setLoading(false);

                await deleteRoom(id);

                console.log("Room and images deleted successfully.");
            } catch (error) {
                console.error("Delete sequence failed:", error);
            }
        }
    };

    return (
        <div className="container mt-4 pb-5">
            {/* Admin Action Bar */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom-gold pb-3">
                <div>
                    <h2 className="text-gold font-playfair mb-0">Room Inventory</h2>
                    <p className="text-white small mb-0">Add, Edit, or Remove Suites</p>
                </div>
                <button className="btn btn-gold-admin px-4 py-2 shadow-sm" onClick={openAddModal}>
                    <i className="bi bi-plus-circle me-2"></i>ADD NEW ROOM
                </button>
            </div>

            <div className="row g-4">
                {rooms.map((room) => (
                    <RoomDashboardCard key={room.id} room={room} openEditModal={openEditModal} handleDelete={handleDelete} />
                ))}
            </div>
            <RoomModal
                isOpen={modalConfig.isOpen}
                roomToEdit={modalConfig.roomToEdit}
                onSave={handleSaveRoom}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />
        </div>
    );
};

export default RoomsDashboard;