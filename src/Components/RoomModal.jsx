import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../Context/FirebaseContext';
import '../CSS/RoomModal.css';
import Alert from './Alert';
import Loader from './Loader';
import { Room } from '../Models/Room';

/** @param {{ isOpen: boolean, onClose: Function, roomToEdit: Room, onSave: Function }} props */
const RoomModal = ({ isOpen, onClose, roomToEdit, onSave }) => {
    const { uploadOrReplaceFile } = useFirebase();
    const [uploadingIndex, setUploadingIndex] = useState(null);

    const initialFormState = {
        roomNumber: '',
        name: '',
        price: '',
        description: '',
        features: '',
        status: 'Not Occupied',
        images: ["", "", ""],
        currentGuestId: null
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (roomToEdit) {
            // Ensure images array always has 3 slots for the UI
            const currentImages = [...roomToEdit.images];
            while (currentImages.length < 3) currentImages.push("");

            setFormData({
                ...roomToEdit,
                features: roomToEdit.features.join(', '),
                images: currentImages
            });
        } else {
            setFormData(initialFormState);
        }
    }, [roomToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (!file || formData.roomNumber === "") return;

        setUploadingIndex(index);
        try {
            const folderPath = `Room Images/${formData.roomNumber}`;
            const oldUrl = formData.images[index] !== "" ? formData.images[index] : null;

            // Uses the context function we built earlier
            const newUrl = await uploadOrReplaceFile(oldUrl, folderPath, file);

            const updatedImages = [...formData.images];
            updatedImages[index] = newUrl;
            setFormData(prev => ({ ...prev, images: updatedImages }));
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validImages = formData.images.filter(url => url !== "");

        const finalData = {
            ...formData,
            features: formData.features.split(', ').map(f => f.trim()),
            images: validImages
        };

        onSave(finalData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay room-modal">
            <div className="custom-modal-content animate-slide-up">
                <div className="modal-header-gold">
                    <h3 className="font-playfair text-gold mb-0">
                        {roomToEdit ? 'Edit Room Details' : 'Add New Luxury Suite'}
                    </h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="d-flex flex-column h-100 overflow-hidden">
                    <div className="modal-body-scrollable">
                        <div className="row g-3">
                            {/* Standard inputs... */}
                            <div className="col-md-4">
                                <label className="admin-label">Room Number</label>
                                <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }} className="form-control admin-input" maxLength="3" required disabled={roomToEdit} />
                            </div>
                            <div className="col-md-8">
                                <label className="admin-label">Room Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control admin-input" required />
                            </div>
                            <div className="col-md-8">
                                <label className="admin-label">Room Price</label>
                                <input type="text" name="price" value={formData.price} onChange={handleChange} onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9.]/g, ''); }} className="form-control admin-input" required />
                            </div>
                            <div className="col-md-8">
                                <label className="admin-label">Room Features</label>
                                <input type="text" name="features" value={formData.features} onChange={handleChange} className="form-control admin-input" required />
                            </div>

                            {/* Image Upload Gallery */}
                            <div className="col-12 mt-3">
                                <label className="admin-label text-gold small fw-bold">Room Gallery (3 Images Required)</label>
                                <div className="row g-2 row-cols-1 row-cols-sm-2 row-cols-md-4 justify-content-center">
                                    {formData.images.map((url, index) => (
                                        <div key={index} className="image-upload-card">
                                            {/* The Image Preview */}
                                            {url && <img src={url} alt="Room" className="img-preview" />}

                                            {/* The Empty State (if no image and not loading) */}
                                            {url === "" && uploadingIndex !== index && (
                                                <div className="empty-preview">
                                                    <i className="bi bi-camera"></i>
                                                </div>
                                            )}

                                            {/* Custom Luxury Loader Overlay */}
                                            {uploadingIndex === index && (
                                                <div className="upload-loader-overlay">
                                                    <div className="spinner-gold"></div>
                                                    <span className="upload-text">Processing...</span>
                                                </div>
                                            )}

                                            {/* Upload Button Overlay (Hidden while loading) */}
                                            {uploadingIndex !== index && (
                                                <label className="upload-overlay">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(index, e)}
                                                        hidden
                                                        disabled={formData.roomNumber === "" || uploadingIndex !== null}
                                                    />
                                                    {url ? 'Replace' : 'Upload'}
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {formData.roomNumber === "" && <small className="text-danger">Enter Room Number first to enable upload.</small>}
                            </div>

                            {/* Remaining text inputs... */}
                            <div className="col-12 mt-3">
                                <label className="admin-label">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className="form-control admin-input" rows="3" required></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer-admin">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-gold-admin px-4" disabled={uploadingIndex !== null || formData.images.some(img => img === "")}>
                            {roomToEdit ? 'Update Room' : 'Save Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoomModal;