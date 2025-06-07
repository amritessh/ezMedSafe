import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // AuthProvider and useAuth hook
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AlertHistoryPage from './pages/AlertHistoryPage';
import Navbar from './components/common/Navbar'; // New component
import { Toaster } from 'sonner'; // Shadcn toast provider

// A private route component that checks authentication
// function PrivateRoute({ children }) {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className='min-h-screen flex items-center justify-center'>
//         Loading...
//       </div>
//     ); // Simple loading state
//   }

//   return isAuthenticated ? children : <Navigate to='/login' replace />;
// }

// Main App component that sets up routing and auth context
function App() {
  return (
    <AuthProvider>
      {' '}
      {/* Wrap the entire app with AuthProvider */}
      <Router>
        <div className='flex flex-col min-h-screen'>
          {/* Navbar should only show if authenticated, or conditionally */}
          <AuthAwareNavbar />{' '}
          {/* Custom component to handle Navbar visibility */}
          <main className='flex-grow'>
            <Routes>
              <Route path='/login' element={<LoginPage />} />
              <Route
                path='/'
                element={
                  // <PrivateRoute>
                  <HomePage />
                  // </PrivateRoute>
                }
              />
              <Route
                path='/history'
                element={
                  // <PrivateRoute>
                  <AlertHistoryPage />
                  // </PrivateRoute>
                }
              />
              {/* Catch all other routes and redirect to home if authenticated, else login */}
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </main>
        </div>
      </Router>
      <Toaster richColors /> {/* Shadcn toast provider */}
    </AuthProvider>
  );
}

// Component to conditionally render Navbar based on auth state
function AuthAwareNavbar() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navbar /> : <Navbar />;
}

export default App;
