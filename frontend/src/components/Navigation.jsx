import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ isAuthenticated, user, onLogout }) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/">👻 GhostNet</Link>
          </div>
          <div className="nav-menu">
            <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
              🏠 Accueil
            </Link>
            <Link to="/about" className={isActive('/about') ? 'nav-link active' : 'nav-link'}>
              📚 À propos
            </Link>
            <Link to="/login" className="nav-link login-btn">
               Connexion
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/dashboard">👻 GhostNet</Link>
        </div>
        <div className="nav-menu">
          <Link to="/dashboard" className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}>
             Tableau de bord
          </Link>
          
          <div className="dropdown" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="dropdown-toggle">
              ☰
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/detection" className="dropdown-item">🔍 Détection</Link>
                <Link to="/users" className="dropdown-item">👥 Utilisateurs</Link>
                <Link to="/reports" className="dropdown-item">📊 Rapports</Link>
              </div>
            )}
          </div>

          <div className="nav-user">
            <span className="user-info">
              👤 {user?.username || 'Utilisateur'}
            </span>
            <button onClick={onLogout} className="nav-link logout-btn">
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 