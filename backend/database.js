const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ddos_detection.db');
const db = new sqlite3.Database(dbPath);

// Initialisation de la base de données
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table pour l'historique des détections
      db.run(`
        CREATE TABLE IF NOT EXISTS detections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          seuil INTEGER NOT NULL,
          ip_bloquees TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table pour les IPs bloquées
      db.run(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_address TEXT UNIQUE NOT NULL,
          blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Table pour les alertes
      db.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT DEFAULT 'medium',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_read BOOLEAN DEFAULT 0
        )
      `);

      // Table pour les statistiques en cache
      db.run(`
        CREATE TABLE IF NOT EXISTS stats_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_address TEXT NOT NULL,
          request_count INTEGER NOT NULL,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table pour les utilisateurs
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);

      resolve();
    });
  });
};

// Fonctions pour l'historique
const saveDetection = (date, seuil, ipBloquees) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO detections (date, seuil, ip_bloquees) 
      VALUES (?, ?, ?)
    `);
    stmt.run(date, seuil, JSON.stringify(ipBloquees), function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
    stmt.finalize();
  });
};

const getDetections = (limit = 50) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM detections 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) reject(err);
      else {
        const detections = rows.map(row => ({
          ...row,
          ipBloquees: JSON.parse(row.ip_bloquees)
        }));
        resolve(detections);
      }
    });
  });
};

// Fonctions pour les IPs bloquées
const saveBlockedIPs = (ips) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO blocked_ips (ip_address, is_active) 
      VALUES (?, 1)
    `);
    
    ips.forEach(ip => {
      stmt.run(ip);
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const getBlockedIPs = () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT ip_address FROM blocked_ips 
      WHERE is_active = 1
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.ip_address));
    });
  });
};

const unblockIP = (ip) => {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE blocked_ips 
      SET is_active = 0 
      WHERE ip_address = ?
    `, [ip], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

// Fonctions pour les alertes
const createAlert = (type, message, severity = 'medium') => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO alerts (type, message, severity) 
      VALUES (?, ?, ?)
    `);
    stmt.run(type, message, severity, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
    stmt.finalize();
  });
};

const getAlerts = (limit = 20) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM alerts 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Fonctions pour le cache des statistiques
const updateStatsCache = (stats) => {
  return new Promise((resolve, reject) => {
    // Vider le cache existant
    db.run('DELETE FROM stats_cache', (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Insérer les nouvelles statistiques
      const stmt = db.prepare(`
        INSERT INTO stats_cache (ip_address, request_count) 
        VALUES (?, ?)
      `);
      
      Object.entries(stats).forEach(([ip, count]) => {
        stmt.run(ip, count);
      });
      
      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

const getStatsCache = () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT ip_address, request_count FROM stats_cache
    `, (err, rows) => {
      if (err) reject(err);
      else {
        const stats = {};
        rows.forEach(row => {
          stats[row.ip_address] = row.request_count;
        });
        resolve(stats);
      }
    });
  });
};

// --- Gestion des utilisateurs ---
const getUsers = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, username, email, role, active, created_at, last_login FROM users`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const createUser = (username, email, password, role) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`);
    stmt.run(username, email, password, role, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, username, email, role, active: 1, created_at: new Date().toISOString(), last_login: null });
    });
    stmt.finalize();
  });
};

const updateUser = (id, username, email, role) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`, [username, email, role, id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

const updateUserPassword = (id, password) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [password, id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

const toggleUserStatus = (id, active) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET active = ? WHERE id = ?`, [active ? 1 : 0, id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  initDatabase,
  saveDetection,
  getDetections,
  saveBlockedIPs,
  getBlockedIPs,
  unblockIP,
  createAlert,
  getAlerts,
  updateStatsCache,
  getStatsCache,
  getUsers,
  getUserByUsername,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  toggleUserStatus
}; 