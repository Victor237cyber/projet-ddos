const { Server } = require('socket.io');
const { createAlert } = require('./database');

class WebSocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });
    
    this.connectedUsers = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Utilisateur connecté: ${socket.id}`);
      
      // Authentification du socket
      socket.on('authenticate', (token) => {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_super_securise_2024');
          this.connectedUsers.set(socket.id, decoded);
          socket.emit('authenticated', { success: true });
          console.log(`✅ Socket authentifié: ${decoded.username}`);
        } catch (error) {
          socket.emit('authenticated', { success: false, error: 'Token invalide' });
        }
      });

      // Rejoindre une room pour les notifications
      socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`📡 Socket ${socket.id} rejoint la room: ${room}`);
      });

      // Déconnexion
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        console.log(`🔌 Utilisateur déconnecté: ${socket.id}`);
      });

      // Chat en temps réel pour les administrateurs
      socket.on('admin-message', (message) => {
        const user = this.connectedUsers.get(socket.id);
        if (user && user.role === 'admin') {
          this.broadcastToAdmins('admin-message', {
            user: user.username,
            message: message,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  // Envoyer une notification à tous les utilisateurs connectés
  broadcastNotification(type, data) {
    this.io.emit('notification', {
      type,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Envoyer aux administrateurs seulement
  broadcastToAdmins(event, data) {
    this.io.to('admins').emit(event, data);
  }

  // Notification d'attaque DDoS détectée
  async notifyDDoSDetection(ips, count) {
    const message = `🚨 ATTENTION: ${count} IP(s) suspecte(s) détectée(s): ${ips.join(', ')}`;
    
    // Créer une alerte en base
    await createAlert('ddos_detection', message, 'high');
    
    // Notifier en temps réel
    this.broadcastNotification('ddos_detection', {
      ips,
      count,
      message,
      severity: 'high'
    });
  }

  // Notification de nouvelle alerte
  notifyNewAlert(alert) {
    this.broadcastNotification('new_alert', alert);
  }

  // Notification de changement de statut système
  notifySystemStatus(status) {
    this.broadcastNotification('system_status', status);
  }

  // Notification de mise à jour des statistiques
  notifyStatsUpdate(stats) {
    this.broadcastNotification('stats_update', stats);
  }

  // Notification de déblocage d'IP
  notifyIPUnblocked(ip, user) {
    this.broadcastNotification('ip_unblocked', {
      ip,
      user,
      timestamp: new Date().toISOString()
    });
  }

  // Obtenir le nombre d'utilisateurs connectés
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Obtenir la liste des utilisateurs connectés
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }
}

module.exports = WebSocketManager; 