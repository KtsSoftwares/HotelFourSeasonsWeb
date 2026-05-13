import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Carousel } from 'bootstrap';
import '../CSS/CustomerPage.css';
import KtsLogo from '../assets/Images/KTS_Logo.png'
import RoomCard from '../Components/RoomCard';
import Alert from '../Components/Alert';
import { useFirebase } from '../Context/FirebaseContext';
import { Room } from '../Models/Room';

const CustomerPage = () => {
    /** @type {[Room | null, React.Dispatch<React.SetStateAction<Room | null>>]} */
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [bookingText, setBookingText] = useState("BOOK NOW !!!");

    const { rooms, legacyData, hotelData } = useFirebase();

    const carouselRef = useRef(null);

    useEffect(() => {
        // Initialize ONLY if the ref exists
        if (carouselRef.current) {
            const bsCarousel = new Carousel(carouselRef.current, {
                pause: 'hover'
            });

            bsCarousel.cycle();

            return () => {
                bsCarousel.dispose();
            };
        }
    }, []);

    /** @param {Room} room */
    const openRoomDetails = (room) => {
        setSelectedRoom(room);
        setActiveImage(room.images[0]);
    };

    const onModalClose = () => {
        setSelectedRoom(null);
        setActiveImage(null);
        setBookingText("BOOK NOW !!!");
    }

    /*const rooms = [
        {
            id: 1,
            roomNumber: 101,
            name: "Deluxe Gold Suite",
            price: 1500,
            features: ["King Bed", "Plywood Finishes", "City View"],
            description: "A luxury experience featuring our signature shiny gold accents and custom handcrafted plywood furniture.",
            images: [Hero1, Hero2, Hero3]
        },
        {
            id: 2,
            roomNumber: 102,
            name: "Deluxe Silver Suite",
            price: 2000,
            features: ["Queen Bed", "Wooden Finishes", "Mountain View"],
            description: "A sophisticated retreat with elegant wooden furnishings and breathtaking mountain vistas.",
            images: [Hero2, Hero1, Hero3]
        },
        {
            id: 3,
            roomNumber: 103,
            name: "Deluxe Bronze Suite",
            price: 1000,
            features: ["Twin Beds", "Fabric Upholstery", "Pool View"],
            description: "A cozy yet luxurious space with comfortable twin beds and a stunning poolside view.",
            images: [Hero3, Hero1, Hero2]
        }
    ];*/

    /*const aboutData = {
        title: "The KTS Story: A Legacy of Resilience",
        paragraphs: [
            "The journey of **KTS (Kurban Tyre Service)** began in the early 1990s in Itanagar, Arunachal Pradesh, where our founder, **Mr. Kurban Ali**, established a small tyre servicing point. Through dedication and a commitment to authenticity, we grew into an authorized dealer and a leader in tyre resoling.",
            "Our success took us back to our roots in Goalpara, Assam, where we expanded into resoling and distribution centers in Bapujinagar and Dostinagar. While the changing economic landscape of the coal industry challenged our industrial sectors, it paved the way for our most ambitious project yet.",
            "Today, Hotel Four Seasons stands at the heart of our original Dostinagar location. As we look forward, KTS is not just expanding—we are reviving. From electronics to our original tyre expertise, we are growing across new locations, carrying our legacy of trust into every new venture."
        ],
        quote: "In the same location where we once serviced the engines of local commerce, we now serve the comfort of our guests.",
        activeYears: "30+",
        activeCenters: "4"
    };

    const hotelData = {
        name: "Hotel Four Seasons",
        address: {
            line1: "Dostinagar, Pancharatna Road",
            city: "Goalpara",
            state: "Assam",
            pin: "783101"
        },
        contactNumbers: ["+91 70867 48062", "+91 94013 91428"],
        email: "info.ktsgroupglp@gmail.com"
    };*/

    return (
        <div>
            <Alert />
            <div className="customer-wrapper">
                {/* 1. Minimalist Branding */}
                <div className="brand-header text-center py-4 d-flex justify-content-center align-items-center">
                    <img src={KtsLogo} alt="Hotel Four Seasons" className="landing-logo" />
                    <h2 className="hotel-logo">HOTEL FOUR SEASONS</h2>
                </div>

                {/* 2. Professional 50% Height Carousel */}
                <div
                    id="hotelCarousel"
                    ref={carouselRef}
                    className="carousel slide"
                    data-bs-ride="carousel"
                    data-bs-interval="5000"
                >
                    <div className="carousel-inner">
                        {hotelData && hotelData.images.carousal.map((imgUrl, index) => (
                            <div
                                key={index}
                                className={`carousel-item ${index === 0 ? 'active' : ''}`}
                            >
                                <img
                                    src={imgUrl}
                                    className="d-block w-100 main-hero-img"
                                    alt={`Hotel Four Seasons View ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>

                    <button className="carousel-control-prev" type="button" data-bs-target="#hotelCarousel" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#hotelCarousel" data-bs-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                    </button>
                </div>

                {/* 3. Room Selection Grid */}
                <div className="container my-5">
                    <div className="row g-4">
                        {rooms.map((room) => (
                            <RoomCard key={room.id} room={room} openRoomDetails={openRoomDetails} />
                        ))}
                    </div>
                </div>

                {/* 4. Room Detail Modal (The "Click" Reveal) */}
                {selectedRoom && (
                    <div className="modal-overlay d-flex align-items-center justify-content-center">
                        <div className="modal-content-custom col-11 col-lg-10 col-xl-8">
                            <button className="close-btn" onClick={() => onModalClose()}>&times;</button>

                            <div className="row g-0">
                                {/* LEFT SIDE: IMAGE GALLERY */}
                                <div className="col-md-7 border-end border-dark">
                                    <div className="main-detail-img">
                                        <img src={activeImage} className="img-fluid w-100" alt="Room View" />
                                    </div>
                                    <div className="thumbnail-bar d-flex p-2 gap-2">
                                        {selectedRoom.images.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                className={`thumb-img ${activeImage === img ? 'active-thumb' : ''}`}
                                                onClick={() => setActiveImage(img)}
                                                alt="Thumbnail"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT SIDE: DETAILS */}
                                <div className="col-md-5 p-4 d-flex flex-column justify-content-between">
                                    <div>
                                        <h2 className="text-gold mb-1">{selectedRoom.name}</h2>
                                        <p className="small mb-4">Room Number: {selectedRoom.roomNumber}</p>

                                        <h6 className="text-white text-uppercase small fw-bold mb-2">Room Amenities</h6>
                                        <ul className="amenities-list">
                                            {selectedRoom.features.map((feature, index) => (
                                                <li key={index}><i className="bi bi-check-circle-fill me-2"></i> {feature}</li>
                                            ))}
                                        </ul>
                                        <p className="text-white-50 mt-4">{selectedRoom.description}</p>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-white mb-3">Rs. {selectedRoom.price} <span className="small">/ Night</span></h3>
                                        <a href={`tel:${hotelData.contactNumbers[1]}`}><button onClick={() => setBookingText(hotelData.contactNumbers[1])} className="btn btn-gold w-100 py-3 fw-bold">{bookingText}</button></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div >
            {/* 5. The KTS Legacy: From Foundations to Hospitality */}
            {legacyData && <section className="about-section py-5">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <h6 className="text-gold text-uppercase tracking-widest mb-3">Our Heritage</h6>
                            <h2 className="display-5 text-white mb-4">{legacyData.title}</h2>

                            {legacyData.paragraphs.slice(0, 2).map((text, index) => (
                                <span key={index} className="text-white-70"><Markdown>{text}</Markdown></span>
                            ))}

                            <div className="quote-box p-4 border-start border-gold mb-4 bg-dark-soft">
                                <i className="bi bi-quote text-gold display-6 d-block mb-2"></i>
                                <span className="text-white-italic fs-5">
                                    <Markdown>{legacyData.quote}</Markdown>
                                </span>
                            </div>

                            {legacyData.paragraphs.slice(2).map((text, index) => (
                                <span key={index} className="text-white-70"><Markdown>{text}</Markdown></span>
                            ))}
                        </div>

                        <div className="col-lg-6">
                            <div className="history-image-grid">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <img src={legacyData.image} alt="Hotel Four Seasons" className="img-fluid border-gold-thin" />
                                    </div>
                                    <div className="col-6">
                                        <div className="stat-card text-center p-3">
                                            <h3 className="text-gold mb-0">{legacyData.activeYears}</h3>
                                            <p className="small text-white-50 mb-0">Years of Trust</p>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="stat-card text-center p-3">
                                            <h3 className="text-gold mb-0">{legacyData.activeCenters}</h3>
                                            <p className="small text-white-50 mb-0">Active Centers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>}

            {/* 6. Dynamic Footer Section */}
            <footer className="footer-section pt-5 mt-5">
                {hotelData && <div className="container">
                    <div className="row g-4 pb-5 border-bottom border-dark">
                        {/* Brand & Address */}
                        <div className="col-md-6">
                            <h4 className="text-gold mb-4">{hotelData.name}</h4>
                            <p className="text-white-50 lh-lg">
                                {hotelData.address.line1}<br />
                                {hotelData.address.city}, {hotelData.address.state}<br />
                                Pin - {hotelData.address.pin}
                            </p>
                        </div>

                        {/* Contact Details */}
                        <div className="col-md-6 text-md-end">
                            <h4 className="text-gold mb-4">Contact Us</h4>
                            <div className="contact-links">
                                {hotelData.contactNumbers.map((num, index) => (
                                    <p key={index} className="text-white mb-1">
                                        <i className="bi bi-telephone-fill text-gold me-2"></i>
                                        <span className="text-decoration-none text-white">
                                            {num}
                                        </span>
                                    </p>
                                ))}
                                <a href={`mailto:${hotelData.email}`} className="text-white-50 mt-3">
                                    Email: {hotelData.email}
                                </a>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-md-end gap-3 mt-4">
                                <a href={`https://wa.me/${hotelData.contactNumbers[1]}`} className="btn btn-outline-gold btn-sm px-4">
                                    WHATSAPP
                                </a>
                                <a href={`tel:${hotelData.contactNumbers[1]}`} className="btn btn-gold btn-sm px-4">
                                    CALL NOW
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Copyright Bar */}
                    <div className="py-4 text-center">
                        <p className="small mb-0">
                            &copy; {new Date().getFullYear()} {hotelData.name} | A KTS Group Venture
                        </p>
                    </div>
                </div>}
                <div className="text-center my-3">
                    <Link to="/" className="return-link">← Return to Lobby</Link>
                </div>
            </footer>
        </div>
    );
};

export default CustomerPage;