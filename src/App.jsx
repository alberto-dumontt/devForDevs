import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import GenerateSpec from './pages/GenerateSpec';
import RoadmapsIndex from './pages/roadmaps/RoadmapsIndex';
import BackendBeginner from './pages/roadmaps/BackendBeginner';
import Community from './pages/Community';
import Recommendations from './pages/Recommendations';
import Courses from './pages/Courses';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import './App.css';

const SETUP_EXCLUDED = ['/', '/login', '/register', '/profile/setup'];

function ProfileSetupGuard() {
  const { user, loading, needsProfileSetup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && needsProfileSetup && !SETUP_EXCLUDED.includes(location.pathname)) {
      navigate('/profile/setup', { replace: true });
    }
  }, [user, loading, needsProfileSetup, location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileSetupGuard />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="u/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
            <Route path="spec" element={<GenerateSpec />} />
            <Route path="roadmaps" element={<RoadmapsIndex />} />
            <Route path="roadmaps/backend-beginner" element={<BackendBeginner />} />
            <Route path="community" element={<Community />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="courses" element={<Courses />} />
            <Route path="jobs" element={<Jobs />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
