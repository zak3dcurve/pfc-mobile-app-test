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


const Router = () => {
  return (
    <Routes>
      {/* Public route: Login page */}
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<App />} />

    </Routes>
  );
};

export default Router;
