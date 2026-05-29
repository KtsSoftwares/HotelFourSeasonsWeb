import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './Routes/LandingPage.jsx';
import AdminLogin from './Routes/AdminLogin.jsx';
import CustomerPage from './Routes/CustomerPage.jsx';
import AdminPortal from './Routes/AdminPortal.jsx';
import CustomerEntry from './Routes/CustomerEntry.jsx';
import RoomsDashboard from './Routes/RoomsDashboard.jsx';
import CustomerList from './Routes/CustomerList.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import Profile from './Routes/ProfilePage.jsx';
import MonthlyReport from './Routes/MonthlyReport.jsx';
import CorporateBilling from './Routes/CorporateBilling.jsx';

function App() {
  return (
    <Routes>
      {/* The "Lobby" - Main Entrance */}
      <Route path="/" element={<LandingPage />} />

      {/* The Guest Experience */}
      <Route path="/explore" element={<CustomerPage />} />

      {/* The Staff Entrance */}
      <Route path="/adminLogin" element={<AdminLogin />} />

      {/* Protected Admin Routes */}

      {/* The Navbar for Admin portal */}
      <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>}>

        <Route index element={<CustomerEntry />} /> {/* Default to Customer Entry on /admin */}

        {/* The Customer Entry Page */}
        <Route path="customerEntry" element={<CustomerEntry />} />


        {/* The Rooms Dashboard Page */}
        <Route path="roomsDashboard" element={<RoomsDashboard />} />

        {/* The Customer List Page */}
        <Route path="customerList" element={<CustomerList />} />

        {/* The Monthly Report Page */}
        <Route path="monthlyReport" element={<MonthlyReport />} />

        {/* The Corporate Conference Page */}
        <Route path="corporateConference" element={<CorporateBilling />} />

        {/* The Profile Page */}
        <Route path="profile" element={<Profile />} />

      </Route>
    </Routes>
  );
}

export default App;