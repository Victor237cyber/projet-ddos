import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>🛡️GhostNet</h1>
          <h2>Protection avancée contre les attaques DDoS</h2>
          <p>
            Détectez, analysez et neutralisez les attaques par déni de service distribué 
            avec notre système intelligent de cybersécurité.
          </p>
          <div className="hero-buttons">
            <Link to="/about" className="btn btn-primary">
              📚 En savoir plus
            </Link>
            <Link to="/login" className="btn btn-secondary">
               Se connecter
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="shield-animation">
            <div className="shield"></div>
            <div className="particles"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>✨ Fonctionnalités principales</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Détection intelligente</h3>
            <p>Analyse en temps réel du trafic réseau avec seuils configurables</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Visualisation avancée</h3>
            <p>Graphiques interactifs et tableaux de bord en temps réel</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚨</div>
            <h3>Alertes instantanées</h3>
            <p>Notifications en temps réel avec niveaux de gravité</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗄️</div>
            <h3>Base de données sécurisée</h3>
            <p>Stockage persistant avec authentification JWT</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Interface responsive</h3>
            <p>Accessible sur tous les appareils (desktop, mobile, tablet)</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Rapports détaillés</h3>
            <p>Export des données en JSON et CSV pour analyse</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <h2>📈 Statistiques mondiales DDoS</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">+200%</div>
            <div className="stat-label">Augmentation des attaques DDoS en 2024</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">15.4M</div>
            <div className="stat-label">Attaques DDoS détectées par jour</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">$2.5M</div>
            <div className="stat-label">Coût moyen d'une attaque DDoS</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Taux de détection de notre système</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>🚀 Prêt à sécuriser votre infrastructure ?</h2>
          <p>
            Rejoignez des milliers d'organisations qui font confiance à notre système 
            de détection DDoS pour protéger leurs actifs numériques.
          </p>
          <Link to="/login" className="btn btn-primary btn-large">
            🛡️ Commencer maintenant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 