import {React, lazy, Suspense} from 'react';
import { Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import Layout from "./pages/Layout";
import PersistLogin from './components/userAuth/persistLogin';
import MapPage from './pages/Application/MapPage';
import RequireAuth from "./components/userAuth/requireAuth";
import SkeletonFullPage from './pages/Skeleton/SkeletonFullPage';
import "react-loading-skeleton/dist/skeleton.css";

const BookingsPage = lazy( () => import('./pages/Application/BookingsPage'));
const MessagesPage = lazy( () => import('./pages/Application/MessagesPage'));
const ResetPass = lazy( () => import('./pages/Application/ResetPass'));
const InputNewPassword = lazy( () => import('./pages/Application/InputNewPass'));
const VerifyPage = lazy( () => import("./pages/Application/VerifyPage"));

const PaymentsPage = lazy( () => import("./pages/Application/PaymentsPage"));
const SettingsPage = lazy( () => import("./pages/Application/SettingsPage"));
const TermsPage = lazy( () => import("./pages/Application/TermsPage"));
const PrivacyPage = lazy( () => import("./pages/Application/PrivacyPage"));
const UnauthorizedPage = lazy( () => import("./pages/Application/UnauthorizedPage"));
const Missing = lazy( () => import('./components/errorHandler/Missing'));
const ErrorFallback = lazy( () => import('./components/errorHandler/ErrorFallback'));

const AdminPageDriver = lazy( () => import("./pages/Application/AdminPageDriver"));
const AdminPageHost = lazy( () => import("./pages/Application/AdminPageHost"));
const AdminPageControl = lazy( () => import('./pages/Application/AdminPageControl'));
const AdminPagePayouts = lazy( () => import('./pages/Application/AdminPagePayouts'));

const ROLES = {
  'User': 2001,
  'Manager': 3780,
  'Admin': 5150
}

function App() {

  const navigate = useNavigate()

  return (
    
    <Routes>
      
      <Route path="/" element={<Layout />}>

      <Route element={<PersistLogin />}> 
      
          <Route path="" element={<Navigate to='/map' />}></Route>
        
          <Route path="/map" element={<MapPage />}></Route>

          <Route path="/verify" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <VerifyPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/terms" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <TermsPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/privacy" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <PrivacyPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/resetpassword" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <ResetPass />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/inputnewpassword" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <InputNewPassword />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/unauthorized" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <UnauthorizedPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route element={<RequireAuth allowedRoles={[ROLES.User, ROLES.Manager, ROLES.Admin]} />}>  

          <Route path="/bookings" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <BookingsPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/messages" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <MessagesPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/settings" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <SettingsPage />
              </Suspense>
          </ErrorBoundary>} />

          <Route path="/payments" element={<ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => navigate('/')}
            >
              <Suspense fallback={<SkeletonFullPage />}>
              <PaymentsPage />
              </Suspense>
          </ErrorBoundary>} />

        </Route>

        <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>  

            <Route path="/admindriver" element={<ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => navigate('/')}
              >
                <Suspense fallback={<SkeletonFullPage />}>
                  <AdminPageDriver />
                </Suspense>
            </ErrorBoundary>} />

            <Route path="/adminhost" element={<ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => navigate('/')}
              >
                <Suspense fallback={<SkeletonFullPage />}>
                  <AdminPageHost />
                </Suspense>
            </ErrorBoundary>} />

            <Route path="/admincontrol" element={<ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => navigate('/')}
              >
                <Suspense fallback={<SkeletonFullPage />}>
                  <AdminPageControl />
                </Suspense>
            </ErrorBoundary>} />

            <Route path="/adminpayouts" element={<ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => navigate('/')}
              >
                <Suspense fallback={<SkeletonFullPage />}>
                  <AdminPagePayouts />
                </Suspense>
            </ErrorBoundary>} />

        </Route>

        <Route path="*" element={<Missing />} />
    
      </Route>

      </Route>

    </Routes>
  );
}

export default App;