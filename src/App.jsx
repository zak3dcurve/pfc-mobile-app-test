import React, { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Login from './features/auth/pages/login';
import Navbar from './components/app-navbar';
import ProtectedRoute from './router/protected-route';
import ProfilePage from './features/profile/pages/profile';
import PermisDeFeuPage from './features/permis-de-feu/pages/permis-de-feu';
import { Navigate, Route, Routes } from 'react-router-dom';
import AddConsignation from './features/consignation/pages/add-consignation-page';
import ConsignationList from './features/consignation/pages/list-consignation-page';
import HomePage from './home';
import DeconsignationPage from './features/consignation/pages/deconsignation-page';
import ConsignationDetails from './features/consignation/pages/consignation-details';
import ConsignationArchivesPage from './features/consignation/pages/consignation-archives-page';



function App({ className, ...props }) {
  return (
    <>
     <Navbar />
     <Routes>
      {/* Protected routes: User must be logged in to access these */}
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/consignation" element={<ProtectedRoute><AddConsignation /></ProtectedRoute>} />
      <Route path="/consignationlist" element={<ProtectedRoute><ConsignationList /></ProtectedRoute>} />
      <Route path="/pdf" element={<ProtectedRoute><PermisDeFeuPage /></ProtectedRoute>} />
      <Route path="/deconsignation/:id" element={<ProtectedRoute><DeconsignationPage /></ProtectedRoute>} />
      <Route path="/consignationdetails/:id" element={<ProtectedRoute><ConsignationDetails /></ProtectedRoute>} />
      <Route path="/consignationarchives" element={<ProtectedRoute><ConsignationArchivesPage /></ProtectedRoute>} />



      <Route path="*" element={<Navigate to="/profile" />} />
      {/* Add more routes as needed */}
    </Routes>
       </>
  );
}



export default App;