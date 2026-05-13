import { Link } from 'react-router-dom';
import KtsLogo from '../assets/Images/KTS_Logo.png';
import '../CSS/LandingPage.css';
import { useFirebase } from '../Context/FirebaseContext';

const LandingPage = () => {

  const { hotelData } = useFirebase();

  return (
    <>
      <div className="landing-wrapper font-playfair d-flex flex-column align-items-center justify-content-start vh-100" style={{ background: `url(${hotelData ? hotelData.images.welcome : "https://via.placeholder.com/150?text=No+Image"}) no-repeat center center` }}>
        {/* The Overlay creates the professional dark atmosphere */}
        <div className="hero-overlay"></div>

        <img src={KtsLogo} alt="Hotel Four Seasons Logo" className="landing-logo z-3 my-3" />

        <div className="container z-3 text-center">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 main-card p-5">

              <h1 className="display-4 fw-light hotel-title mb-2">
                HOTEL FOUR SEASONS
              </h1>
              <p className="text-uppercase tracking-widest mb-5 tagline">
                Hospitality • Luxury • Comfort
              </p>

              <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                {/* Guest Route */}
                <Link to="/explore"><button className="btn btn-gold btn-lg px-5 py-3 text-uppercase">
                  Guest Entrance
                </button></Link>

                {/* Admin Route */}
                <Link to="/adminLogin">< button className="btn btn-outline-light btn-lg px-5 py-3 text-uppercase">
                  Admin Portal
                </button></Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LandingPage