const cron = require('node-cron');
const fs = require('fs');
const csv = require('csv-parser');
const { createAlert, updateStatsCache, getStatsCache } = require('./database');

// Cache en mémoire pour les performances
let statsCache = {};
let lastCheck = new Date();

// Configuration du monitoring
const MONITORING_CONFIG = {
  checkInterval: '*/30 * * * * *', // Toutes les 30 secondes
  alertThreshold: 50, // Seuil de requêtes par IP
  uniqueIpThreshold: 200, // Seuil pour la détection de botnet (nombre d'IP uniques)
  minIntervalThresholdMs: 100, // Seuil pour l'intervalle entre les requêtes (en ms)
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  maxRequestsPerMinute: 100
};

// Analyse du trafic en temps réel
// IMPORTANT : Pour l'analyse d'intervalle, le fichier trafic.csv doit contenir une colonne 'timestamp' (ex: new Date().toISOString())
const analyzeTraffic = () => {
  return new Promise((resolve, reject) => {
    const counts = {};
    const ipTimestamps = {}; // Pour stocker les timestamps de chaque IP
    const currentTime = new Date();
    
    fs.createReadStream('data/trafic.csv')
      .pipe(csv())
      .on('data', (row) => {
        const ip = row.ip_source;
        const timestamp = row.timestamp ? new Date(row.timestamp) : null;

        // Compteur de requêtes
        counts[ip] = (counts[ip] || 0) + 1;

        // Stockage des timestamps pour l'analyse d'intervalle
        if (timestamp) {
            if (!ipTimestamps[ip]) {
                ipTimestamps[ip] = [];
            }
            ipTimestamps[ip].push(timestamp);
        }
      })
      .on('end', () => {
        // Mettre à jour le cache
        statsCache = counts;
        lastCheck = currentTime;
        
        // Lancer la vérification des anomalies avec les données collectées
        checkForAnomalies({ counts, ipTimestamps });
        
        resolve({ counts, ipTimestamps });
      })
      .on('error', reject);
  });
};

// Détection d'anomalies
const checkForAnomalies = async (trafficData) => {
  const { counts, ipTimestamps } = trafficData;
  const anomalies = [];
  
  // 1. Détection basée sur le Taux de requêtes par IP (logique existante)
  Object.entries(counts).forEach(([ip, count]) => {
    if (count > MONITORING_CONFIG.alertThreshold) {
      anomalies.push({ ip, count, reason: 'Taux de requêtes élevé' });
    }
  });
  
  if (anomalies.length > 0) {
    const message = `🚨 Détection de ${anomalies.length} IP(s) suspecte(s): ${anomalies.map(a => `${a.ip} (${a.count} req)`).join(', ')}`;
    try {
      await createAlert('ddos_detection', message, 'high');
      console.log(`[MONITORING] ${message}`);
    } catch (error) {
      console.error('[MONITORING] Erreur lors de la création de l\'alerte:', error);
    }
  }

  // 2. Détection d'attaque par Botnet (basée sur le nombre d'IP uniques)
  const uniqueIpCount = Object.keys(counts).length;
  if (uniqueIpCount > MONITORING_CONFIG.uniqueIpThreshold) {
    const message = `🚨 Alerte Botnet: ${uniqueIpCount} IP sources uniques détectées, seuil de ${MONITORING_CONFIG.uniqueIpThreshold} dépassé.`;
    try {
        await createAlert('botnet_detection', message, 'critical');
        console.log(`[MONITORING] ${message}`);
    } catch (error) {
        console.error('[MONITORING] Erreur lors de la création de l\'alerte botnet:', error);
    }
  }

  // 3. Détection de bots (basée sur l'intervalle entre les requêtes)
  Object.entries(ipTimestamps).forEach(([ip, timestamps]) => {
    if (timestamps.length > 1) {
        // Trier les timestamps pour être sûr
        timestamps.sort((a, b) => a - b);
        for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i] - timestamps[i-1];
            if (interval < MONITORING_CONFIG.minIntervalThresholdMs) {
                const message = `🚨 Alerte Bot: L'IP ${ip} envoie des requêtes avec un intervalle suspect de ${interval} ms.`;
                // Pour éviter de spammer, on alerte une seule fois par IP et par analyse
                createAlert('bot_detection', message, 'warning').catch(e => console.error(e));
                console.log(`[MONITORING] ${message}`);
                return; // On passe à l'IP suivante après la première détection
            }
        }
    }
  });
};

// Surveillance automatique avec cron
const startMonitoring = () => {
  console.log('🔍 Démarrage du monitoring automatique...');
  
  // Tâche de surveillance toutes les 30 secondes
  cron.schedule(MONITORING_CONFIG.checkInterval, async () => {
    try {
      await analyzeTraffic();
      await updateStatsCache(statsCache);
    } catch (error) {
      console.error('[MONITORING] Erreur lors de l\'analyse:', error);
    }
  });
  
  // Tâche de nettoyage quotidien
  cron.schedule('0 2 * * *', () => {
    console.log('[MONITORING] Nettoyage quotidien du cache...');
    statsCache = {};
  });
};

// Obtenir les statistiques depuis le cache
const getCachedStats = async () => {
  const now = new Date();
  const cacheAge = now - lastCheck;
  
  // Si le cache est récent, l'utiliser
  if (cacheAge < MONITORING_CONFIG.cacheExpiry && Object.keys(statsCache).length > 0) {
    return statsCache;
  }
  
  // Sinon, recharger depuis la base de données
  try {
    const dbStats = await getStatsCache();
    if (Object.keys(dbStats).length > 0) {
      statsCache = dbStats;
      lastCheck = now;
      return dbStats;
    }
  } catch (error) {
    console.error('[MONITORING] Erreur lors du chargement du cache:', error);
  }
  
  // En dernier recours, analyser le trafic
  return await analyzeTraffic();
};

// Surveillance de la santé du système
const getSystemHealth = () => {
  const health = {
    status: 'healthy',
    lastCheck: lastCheck,
    cacheSize: Object.keys(statsCache).length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  };
  
  // Vérifier si le système est en bonne santé
  const memoryUsage = health.memory.heapUsed / health.memory.heapTotal;
  if (memoryUsage > 0.8) {
    health.status = 'warning';
    health.message = 'Utilisation mémoire élevée';
  }
  
  return health;
};

module.exports = {
  startMonitoring,
  analyzeTraffic,
  getCachedStats,
  getSystemHealth,
  MONITORING_CONFIG
}; 