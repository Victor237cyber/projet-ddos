import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

// Helper pour formater les alertes
const getAlertDetails = (alert) => {
  switch (alert.type) {
    case 'ddos_detection':
      return { icon: '🔥', title: 'Attaque DDoS Détectée' };
    case 'botnet_detection':
      return { icon: '🤖', title: 'Attaque Botnet Probable' };
    case 'bot_detection':
      return { icon: '⚡', title: 'Comportement de Bot Détecté' };
    case 'user_created':
      return { icon: '👤', title: 'Nouvel Utilisateur Créé' };
    case 'simulation':
      return { icon: '🧪', title: 'Simulation Lancée' };
    default:
      return { icon: '🔔', title: 'Alerte Générale' };
  }
};

function DashboardPage({ token }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [alertError, setAlertError] = useState(null);
  const [users, setUsers] = useState([]);

  // Fonction pour obtenir le header d'auth
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    fetch('http://localhost:3001/alerts?limit=5', {
      headers: getAuthHeaders()
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setAlerts([]);
        }
        setAlertError(null);
      })
      .catch(() => {
        setAlerts([]);
        setAlertError('Impossible de charger les alertes (accès refusé ou serveur indisponible)');
      });
    // Récupérer les utilisateurs
    fetch('http://localhost:3001/users', { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
      })
      .catch(() => setUsers([]));
  }, [token]);

  return (
    <div className="dashboard-page dashboard-full">
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Tableau de bord</h1>
          <p>Bienvenue sur votre système de sécurité</p>
        </div>
        {/* Statistiques rapides */}
        <div className="dashboard-stats">
          <div className="stat-card stat-alerts">
            <span className="stat-icon" role="img" aria-label="Alertes">🚨</span>
            <div>
              <div className="stat-value">8</div>
              <div className="stat-label">Alertes aujourd'hui</div>
            </div>
          </div>
          <div className="stat-card stat-users">
            <span className="stat-icon" role="img" aria-label="Utilisateurs">👥</span>
            <div>
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Utilisateurs</div>
            </div>
          </div>
          <div className="stat-card stat-blocked">
            <span className="stat-icon" role="img" aria-label="IP Bloquées">⛔</span>
            <div>
              <div className="stat-value">3</div>
              <div className="stat-label">IP bloquées</div>
            </div>
          </div>
          <div className="stat-card stat-lastattack">
            <span className="stat-icon" role="img" aria-label="Dernière attaque">🔥</span>
            <div>
              <div className="stat-value">22/06/2025</div>
              <div className="stat-label">Dernière attaque</div>
            </div>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-icon" role="img" aria-label="Détection">🔍</span>
            <h3>Détection</h3>
            <p>Lancez des analyses de sécurité et surveillez les menaces</p>
            <button className="btn btn-primary" onClick={() => navigate('/detection')}>
              Accéder à la détection
            </button>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-icon" role="img" aria-label="Utilisateurs">👥</span>
            <h3>Utilisateurs</h3>
            <p>Gérez les utilisateurs et leurs permissions</p>
            <button className="btn btn-primary" onClick={() => navigate('/users')}>
              Gérer les utilisateurs
            </button>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-icon" role="img" aria-label="Rapports">📈</span>
            <h3>Rapports</h3>
            <p>Consultez les rapports et analyses</p>
            <button className="btn btn-primary" onClick={() => navigate('/reports')}>
              Voir les rapports
            </button>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-icon" role="img" aria-label="Documentation">📚</span>
            <h3>Documentation</h3>
            <p>En savoir plus sur les attaques DDoS</p>
            <button className="btn btn-primary" onClick={() => navigate('/about')}>
              Lire la documentation
            </button>
          </div>
        </div>
      </div>
      <aside className="dashboard-alerts-side">
        <h3>🚨 Alertes récentes</h3>
        {alertError && (
          <div className="alert alert-low">{alertError}</div>
        )}
        <div className="alerts-list">
          {alerts.length === 0 && !alertError ? (
            <div className="alert alert-low">Aucune alerte récente</div>
          ) : (
            alerts.map((alert) => {
              const details = getAlertDetails(alert);
              return (
                <div key={alert.id} className={`alert alert-${alert.severity || 'low'}`}>
                  <div className="alert-header">
                    <span className="alert-icon">{details.icon}</span>
                    <span className="alert-title">{details.title}</span>
                  </div>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-time">{new Date(alert.created_at).toLocaleString()}</span>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}

export default DashboardPage; 