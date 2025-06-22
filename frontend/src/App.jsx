import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DetectionPage from './pages/DetectionPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Vérifier le token au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      // Vérifier si le token est toujours valide
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch('http://localhost:3001/verify-token', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalide, déconnecter
        handleLogout();
      }
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      handleLogout();
    }
  };

  // Déconnexion
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <Navigation isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/detection" element={isAuthenticated ? <DetectionPage token={token} /> : <Navigate to="/login" />} />
          <Route path="/users" element={isAuthenticated ? <UsersPage token={token} /> : <Navigate to="/login" />} />
          <Route path="/login" element={
            <LoginPage
              setToken={setToken}
              setUser={setUser}
              setIsAuthenticated={setIsAuthenticated}
            />
          } />
          <Route path="/reports" element={isAuthenticated ? <ReportsPage token={token} /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardPage token={token} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;         