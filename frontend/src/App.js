import {React, lazy, Suspense} from 'react';
import { Navigate, Route, Routes, useNavigate} from 'react-router-dom';

import Layout from "./pages/Layout";
import PersistLogin from './components/userAuth/persistLogin';

import MapPage from './pages/Application/MapPage'; 
import BookingsPage from './pages/Application/BookingsPage';
import MessagesPage from './pages/Application/MessagesPage';
import ProfilePage from './pages/Application/ProfilePage';
import ResetPass from './pages/Application/ResetPass';
import InputNewPassword from './pages/Application/InputNewPass';
import VerifyPage from "./pages/Application/VerifyPage";
import AdminPage from "./pages/Application/AdminPage";
import SettingsPage from "./pages/Application/SettingsPage";
import TestPage from "./pages/Application/TestPage";
import PaymentsPage from './pages/Application/PaymentsPage';
import PayoutsPage from './pages/Application/PayoutsPage';

const ROLES = {
  'User': 2001,
  'Manager': 3780,
  'Admin': 5150
}


function App() {

  return (
    
    <Routes>
      
      <Route path="/" element={<Layout />}>

      <Route element={<PersistLogin />}> 
      
        <Route path="" element={<Navigate to='/map' />}>

        </Route>
        
        <Route path="/map" 
        
        element={
          <MapPage />
        }>

        </Route>

        <Route path="/bookings" element={<BookingsPage />}>

        </Route>

        <Route path="/test" element={<TestPage />}>

        </Route>

        <Route path="/messages" element={<MessagesPage />}>

        </Route>

        <Route path="/profile" element={<ProfilePage />}>

        </Route>

        <Route path="/verify" element={<VerifyPage />}>

        </Route>

        <Route path="/resetpassword" element={<ResetPass />}>

        </Route>

        <Route path="/settings" element={<SettingsPage />}>

        </Route>

        <Route path="/inputnewpassword" element={<InputNewPassword />}>

        </Route>

        <Route path="/admin" element={<AdminPage />}>

        </Route>

        <Route path="/payments" element={<PaymentsPage />}>

        </Route>

        <Route path="/payouts" element={<PayoutsPage />}>

        </Route>
    
      </Route>

      </Route>

    </Routes>
  );
}

export default App;