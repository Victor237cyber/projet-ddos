import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage({ setToken, setUser, setIsAuthenticated }) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        alert('Erreur de connexion');
      }
    } catch (error) {
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
     
      <div className="login-form">
        <h2>Connexion</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Nom d'utilisateur:</label>
            <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mot de passe:</label>
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage; 