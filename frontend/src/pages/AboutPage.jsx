import React, { useState } from 'react';
import './AboutPage.css';

// Composant principal de la page À propos
// Cette page explique les attaques DDoS et notre solution
const AboutPage = () => {
  // État pour gérer l'onglet actuellement sélectionné
  const [ongletActif, setOngletActif] = useState('what-is-ddos');

  // Configuration des onglets disponibles
  const ongletsDisponibles = [
    { 
      id: 'what-is-ddos', 
      label: 'Qu\'est-ce qu\'un DDoS ?', 
      icone: '❓' 
    },
    { 
      id: 'how-it-works', 
      label: 'Comment ça marche ?', 
      icone: '⚙️' 
    },
    { 
      id: 'types', 
      label: 'Types d\'attaques', 
      icone: '🎯' 
    },
    { 
      id: 'our-solution', 
      label: 'Notre solution', 
      icone: '🛡️' 
    },
    { 
      id: 'demo', 
      label: 'Démonstration', 
      icone: '🎮' 
    }
  ];

  // Fonction pour changer d'onglet
  const changerOnglet = (idOnglet) => {
    setOngletActif(idOnglet);
  };

  // Données des impacts économiques
  const impactsEconomiques = [
    '💸 Coût moyen : 2.5 millions de dollars par attaque',
    '⏰ Temps d\'arrêt : 6-24 heures en moyenne',
    '📉 Perte de confiance des clients',
    '🔒 Atteinte à la réputation de l\'entreprise'
  ];

  // Étapes du processus d'attaque
  const etapesAttaque = [
    {
      numero: 1,
      titre: 'Infection',
      description: 'Les attaquants infectent des milliers d\'ordinateurs avec des logiciels malveillants'
    },
    {
      numero: 2,
      titre: 'Formation du botnet',
      description: 'Les machines infectées forment un réseau contrôlé à distance'
    },
    {
      numero: 3,
      titre: 'Coordination',
      description: 'L\'attaquant envoie des instructions simultanées à toutes les machines'
    },
    {
      numero: 4,
      titre: 'Attaque massive',
      description: 'Des milliers de requêtes sont envoyées simultanément vers la cible'
    },
    {
      numero: 5,
      titre: 'Paralysie',
      description: 'Le serveur cible est submergé et devient indisponible'
    }
  ];

  // Types d'attaques DDoS
  const typesAttaques = [
    {
      icone: '🌊',
      titre: 'Volume-based',
      description: 'Submerge la bande passante avec un trafic massif',
      exemples: ['UDP Flood', 'ICMP Flood', 'Amplification DNS']
    },
    {
      icone: '⚡',
      titre: 'Protocol-based',
      description: 'Exploite les failles des protocoles réseau',
      exemples: ['SYN Flood', 'Ping of Death', 'Smurf Attack']
    },
    {
      icone: '🎭',
      titre: 'Application-based',
      description: 'Cible les applications web spécifiques',
      exemples: ['HTTP Flood', 'Slowloris', 'DNS Query Flood']
    }
  ];

  // Étapes de notre solution
  const etapesSolution = [
    {
      icone: '🔍',
      titre: '1. Détection intelligente',
      description: 'Notre système analyse en temps réel le trafic réseau et détecte les patterns anormaux grâce à des algorithmes avancés.'
    },
    {
      icone: '📊',
      titre: '2. Analyse comportementale',
      description: 'Nous établissons un profil de trafic normal et identifions les déviations suspectes avec des seuils configurables.'
    },
    {
      icone: '🚨',
      titre: '3. Alertes instantanées',
      description: 'Dès qu\'une menace est détectée, vous recevez des notifications en temps réel avec des niveaux de gravité.'
    },
    {
      icone: '🛡️',
      titre: '4. Protection automatique',
      description: 'Les adresses IP malveillantes sont automatiquement bloquées et ajoutées à une liste noire.'
    },
    {
      icone: '📈',
      titre: '5. Rapports détaillés',
      description: 'Générez des rapports complets pour analyser les tendances et améliorer votre sécurité.'
    },
    {
      icone: '⚡',
      titre: '6. Performance optimisée',
      description: 'Notre système utilise un cache intelligent pour maintenir des performances optimales même sous charge.'
    }
  ];

  return (
    <div className="about-page">
      {/* En-tête de la page */}
      <div className="about-header">
        <h1>📚 Guide complet des attaques DDoS</h1>
        <p>Comprenez les menaces et découvrez comment notre système vous protège</p>
      </div>

      {/* Navigation entre les onglets */}
      <div className="tab-navigation">
        {ongletsDisponibles.map(onglet => (
          <button
            key={onglet.id}
            className={`tab-button ${ongletActif === onglet.id ? 'active' : ''}`}
            onClick={() => changerOnglet(onglet.id)}
          >
            <span className="tab-icon">{onglet.icone}</span>
            {onglet.label}
          </button>
        ))}
      </div>

      {/* Contenu principal des onglets */}
      <div className="tab-content">
        {/* Onglet : Qu'est-ce qu'un DDoS */}
        {ongletActif === 'what-is-ddos' && (
          <div className="tab-panel">
            <h2>❓ Qu'est-ce qu'une attaque DDoS ?</h2>
            <div className="content-grid">
              <div className="content-text">
                <h3>Définition</h3>
                <p>
                  <strong>DDoS</strong> signifie <em>"Distributed Denial of Service"</em> 
                  (Déni de Service Distribué). C'est une attaque cybernétique qui vise à 
                  rendre un service indisponible en le submergeant de requêtes.
                </p>
                
                <h3>Principe de base</h3>
                <p>
                  Les attaquants utilisent un réseau d'ordinateurs infectés (botnet) pour 
                  envoyer simultanément des milliers de requêtes vers une cible, 
                  provoquant une surcharge qui paralyse le service.
                </p>
                
                <h3>Impact économique</h3>
                <ul>
                  {impactsEconomiques.map((impact, index) => (
                    <li key={index}>{impact}</li>
                  ))}
                </ul>
              </div>
              
              <div className="content-visual">
                <div className="ddos-diagram">
                  <div className="botnet">🖥️ Botnet</div>
                  <div className="arrows">➡️➡️➡️</div>
                  <div className="target">🎯 Serveur cible</div>
                  <div className="result">💥 Service indisponible</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet : Comment ça marche */}
        {ongletActif === 'how-it-works' && (
          <div className="tab-panel">
            <h2>⚙️ Comment fonctionne une attaque DDoS ?</h2>
            <div className="steps-container">
              {etapesAttaque.map(etape => (
                <div className="step" key={etape.numero}>
                  <div className="step-number">{etape.numero}</div>
                  <h3>{etape.titre}</h3>
                  <p>{etape.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet : Types d'attaques */}
        {ongletActif === 'types' && (
          <div className="tab-panel">
            <h2>🎯 Types d'attaques DDoS</h2>
            <div className="attack-types">
              {typesAttaques.map((type, index) => (
                <div className="attack-card" key={index}>
                  <div className="attack-icon">{type.icone}</div>
                  <h3>{type.titre}</h3>
                  <p>{type.description}</p>
                  <ul>
                    {type.exemples.map((exemple, idx) => (
                      <li key={idx}>{exemple}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet : Notre solution */}
        {ongletActif === 'our-solution' && (
          <div className="tab-panel">
            <h2>🛡️ Comment notre système vous protège</h2>
            <div className="solution-grid">
              {etapesSolution.map((etape, index) => (
                <div className="solution-step" key={index}>
                  <div className="step-icon">{etape.icone}</div>
                  <h3>{etape.titre}</h3>
                  <p>{etape.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet : Démonstration */}
        {ongletActif === 'demo' && (
          <div className="tab-panel">
            <h2>🎮 Démonstration en temps réel</h2>
            <div className="demo-container">
              <div className="demo-scenario">
                <h3>Scénario d'attaque simulée</h3>
                <p>Voici comment notre système réagit face à une attaque DDoS :</p>
              </div>
              
              <div className="demo-steps">
                <div className="demo-step">
                  <div className="step-time">T+0s</div>
                  <div className="step-desc">Trafic normal détecté</div>
                </div>
                <div className="demo-step">
                  <div className="step-time">T+5s</div>
                  <div className="step-desc">Attaque DDoS détectée</div>
                </div>
                <div className="demo-step">
                  <div className="step-time">T+10s</div>
                  <div className="step-desc">Protection activée</div>
                </div>
                <div className="demo-step">
                  <div className="step-time">T+15s</div>
                  <div className="step-desc">Service restauré</div>
                </div>
              </div>
              
              <div className="demo-visual">
                <div className="traffic-simulation">
                  <span className="normal-traffic">Trafic normal</span>
                  <span className="attack-traffic">Attaque DDoS</span>
                  <span className="protection-activation">Protection</span>
                  <span className="service-restored">Service OK</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutPage; 