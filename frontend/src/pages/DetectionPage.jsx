import React, { useEffect, useState } from 'react';
import './DetectionPage.css';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DetectionPage = ({ token }) => {
  const [ips, setIps] = useState([]);
  const [newlyBlocked, setNewlyBlocked] = useState([]);
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState("");
  const [detectionEffectuee, setDetectionEffectuee] = useState(false);
  const [seuil, setSeuil] = useState(20);
  const [alerts, setAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attackHistory, setAttackHistory] = useState([]);
  const [attacksPerDay, setAttacksPerDay] = useState({});

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      const [ipsResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:3001/ip-bloquees', { headers: getAuthHeaders() }),
        fetch('http://localhost:3001/stats', { headers: getAuthHeaders() })
      ]);
      if (ipsResponse.ok) setIps(await ipsResponse.json());
      if (statsResponse.ok) setStats(await statsResponse.json());
    } catch (error) { console.error('Erreur lors du chargement des données:', error); }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3001/alerts?limit=5', { headers: getAuthHeaders() });
      if (response.ok) setAlerts(await response.json());
    } catch (error) { console.error('Erreur lors du chargement des alertes:', error); }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) setSystemHealth(await response.json());
    } catch (error) { console.error('Erreur lors du chargement de la santé du système:', error); }
  };

  useEffect(() => {
    loadData();
    loadAlerts();
    loadSystemHealth();
    // Récupérer l'historique des attaques
    fetch('/export/json', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setAttackHistory(data);
        // Regrouper par jour
        const counts = {};
        data.forEach(entry => {
          const day = entry.date.split('T')[0];
          counts[day] = (counts[day] || 0) + 1;
        });
        setAttacksPerDay(counts);
      })
      .catch(() => {});
  }, []);

  const detectAttack = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/detect?seuil=${seuil}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setIps(data.ipBloquees);
        setNewlyBlocked(data.ipBloquees);
        setDetectionEffectuee(true);
        loadData();
        loadAlerts();
      } else setMessage("Erreur lors de la détection");
    } catch (err) {
      setMessage("Erreur lors de la détection");
    } finally { setLoading(false); }
  };

  const debloquer = async (ip) => {
    try {
      const response = await fetch(`http://localhost:3001/unblock/${ip}`, { method: 'POST', headers: getAuthHeaders() });
      if (response.ok) {
        setIps(ips.filter((i) => i !== ip));
        setMessage(`IP débloquée : ${ip}`);
        loadAlerts();
      }
    } catch (error) { setMessage('Erreur lors du déblocage'); }
  };

  const simulateAttack = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/simulate', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadAlerts();
      }
    } catch (error) { setMessage('Erreur lors de la simulation'); }
    finally { setLoading(false); }
  };

  return (
    <div className="detection-modern">
      {/* Header visuel */}
      <div className="detect-hero">
        <div className="detect-hero-icon">🔍</div>
        <div>
          <h1>Détection d'attaques DDoS</h1>
          <p>Analysez et gérez les menaces en temps réel</p>
        </div>
      </div>

      {/* Statut système */}
      {systemHealth && (
        <div className={`detect-card detect-health ${systemHealth.status}`}>
          <div className="detect-card-title">💓 Santé du système</div>
          <div className="detect-health-stats">
            <span>Statut : <b>{systemHealth.status}</b></span>
            <span>Uptime : <b>{Math.floor(systemHealth.uptime / 60)} min</b></span>
            <span>Mémoire : <b>{Math.round(systemHealth.memory.heapUsed / 1024 / 1024)} MB</b></span>
          </div>
        </div>
      )}

      {/* Alertes récentes */}
      {alerts.length > 0 && (
        <div className="detect-card detect-alerts">
          <div className="detect-card-title">🚨 Alertes récentes</div>
          <div className="detect-alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`detect-alert detect-alert-${alert.severity || 'low'}`}> 
                <span className="detect-alert-icon">{alert.type === 'ddos_detection' ? '🔥' : alert.type === 'bot_detection' ? '⚡' : '🔔'}</span>
                <span className="detect-alert-msg">{alert.message}</span>
                <span className="detect-alert-date">{new Date(alert.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloc de contrôle */}
      <div className="detect-card detect-controls">
        <div className="detect-card-title">🛡️ Contrôle de détection</div>
        <div className="detect-controls-row">
          <label>Seuil DDoS :</label>
          <input type="number" value={seuil} min={1} max={1000} onChange={e => setSeuil(Number(e.target.value))} />
          <button className="btn" onClick={simulateAttack} disabled={loading}>🚀 Simuler une attaque</button>
          <button className="btn" onClick={detectAttack} disabled={loading}>{loading ? 'Analyse...' : 'Lancer la détection'}</button>
        </div>
        <div className="detect-controls-info">Le seuil détermine le nombre de requêtes suspectes avant alerte.</div>
      </div>

      {/* Message d'info */}
      {message && <div className="detect-msg">{message}</div>}

      {/* IP bloquées */}
      <div className="detect-card detect-blocked">
        <div className="detect-card-title">⛔ IP Bloquées</div>
        {detectionEffectuee && newlyBlocked.length === 0 && <div className="detect-empty">Aucune IP détectée.</div>}
        {newlyBlocked.length > 0 && (
          <table className="detect-table">
            <thead>
              <tr>
                <th>Adresse IP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {newlyBlocked.map((ip, idx) => (
                <tr key={idx} className="ip-new-blocked">
                  <td>{ip}</td>
                  <td><button className="btn-red" onClick={() => debloquer(ip)}>Débloquer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Graphique activité réseau */}
      {detectionEffectuee && Object.keys(stats).length > 0 && (
        <div className="detect-card detect-graph">
          <div className="detect-card-title">📊 Activité réseau (Requêtes/IP)</div>
          <Bar
            data={{
              labels: Object.keys(stats),
              datasets: [
                {
                  label: 'Nombre de requêtes',
                  data: Object.values(stats),
                  backgroundColor: 'rgba(99,102,241,0.7)',
                  borderColor: 'rgba(99,102,241,1)',
                  borderWidth: 2
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: 'Nombre de requêtes par IP',
                  font: { size: 18, weight: 'bold' }
                },
                tooltip: { enabled: true }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Adresse IP', font: { size: 15 } },
                  ticks: { maxRotation: 45, minRotation: 45, color: '#333', font: { size: 13 } },
                  grid: { display: false }
                },
                y: {
                  title: { display: true, text: 'Nombre de requêtes', font: { size: 15 } },
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: '#333', font: { size: 13 } },
                  grid: { color: '#e5e7eb' }
                }
              },
              maintainAspectRatio: false,
              height: 900,
              width: 1600
            }}
            height={900}
            width={1600}
          />
        </div>
      )}
      {/* Graphique en ligne du nombre d'attaques détectées par jour */}
      {Object.keys(attacksPerDay).length > 0 && (
        <div className="detect-card detect-graph" style={{ marginTop: 32 }}>
          <div className="detect-card-title">📈 Nombre d'attaques détectées par jour</div>
          <Line
            data={{
              labels: Object.keys(attacksPerDay),
              datasets: [
                {
                  label: "Attaques détectées",
                  data: Object.values(attacksPerDay),
                  fill: false,
                  borderColor: 'rgba(239,68,68,1)',
                  backgroundColor: 'rgba(239,68,68,0.2)',
                  tension: 0.2,
                  pointRadius: 5,
                  pointBackgroundColor: 'rgba(239,68,68,1)'
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: "Nombre d'attaques détectées par jour",
                  font: { size: 18, weight: 'bold' }
                },
                tooltip: { enabled: true }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Date', font: { size: 15 } },
                  ticks: { color: '#333', font: { size: 13 } },
                  grid: { display: false }
                },
                y: {
                  title: { display: true, text: 'Nombre d\'attaques', font: { size: 15 } },
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: '#333', font: { size: 13 } },
                  grid: { color: '#e5e7eb' }
                }
              },
              maintainAspectRatio: false,
              height: 400,
              width: 1200
            }}
            height={400}
            width={1200}
          />
        </div>
      )}
    </div>
  );
};

export default DetectionPage; 