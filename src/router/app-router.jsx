import { Routes, Route } from 'react-router-dom';
import App from '../App';
import Login from '../features/auth/pages/login';
import ProfilePage from '../features/profile/pages/profile';
import ProtectedRoute from './protected-route';
import SidePage from '@/app/dashboard/page';
import Test from '@/features/profile/pages/test';
import ConsignationPage from '@/features/consignation/pages/consignation-page';
import PermisDeFeuPage from '@/features/permis-de-feu/pages/permis-de-feu';
import ConsignationForm from '@/features/consignation/pages/add-consignation-page';
import AddConsignation from '@/features/consignation/pages/list-consignation-page';


const AppRouter = () => {
  return (
    <Routes>
      {/* Public route: Login page */}
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Test />} />


      {/* Protected routes: User must be logged in to access these */}
      <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/consignation" element={<ProtectedRoute><ConsignationForm /></ProtectedRoute>} />
      <Route path="/consignationlist" element={<ProtectedRoute><AddConsignation /></ProtectedRoute>} />
      <Route path="/pdf" element={<ProtectedRoute><PermisDeFeuPage /></ProtectedRoute>} />

      {/* Add more routes as needed */}
    </Routes>
  );
};

export default AppRouter;
