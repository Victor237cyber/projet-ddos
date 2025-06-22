const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Import des nouveaux modules
const { authenticateToken, login } = require('./auth');
const { 
  initDatabase, 
  saveDetection, 
  getDetections, 
  saveBlockedIPs, 
  getBlockedIPs, 
  unblockIP, 
  createAlert, 
  getAlerts,
  getUsers,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} = require('./database');
const { 
  startMonitoring, 
  getCachedStats, 
  getSystemHealth 
} = require('./monitoring');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialisation de la base de données
initDatabase().then(() => {
  console.log('✅ Base de données initialisée');
  startMonitoring();
}).catch(err => {
  console.error('❌ Erreur d\'initialisation de la base de données:', err);
});

// Route d'authentification
app.post('/login', login);

// Route de vérification de token
app.get('/verify-token', authenticateToken, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// Route de santé du système
app.get('/health', (req, res) => {
  res.json(getSystemHealth());
});

// Liste des utilisateurs (réel)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Création utilisateur (réel)
app.post('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { username, email, role, password } = req.body;
    if (!username || !email || !role || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    // Vérifier unicité
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, email, hashed, role);
    await createAlert('user_created', `Nouvel utilisateur créé: ${username}`, 'low');
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erreur lors de la création d\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modification utilisateur (réel)
app.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { id } = req.params;
    const { username, email, role } = req.body;
    await updateUser(id, username, email, role);
    await createAlert('user_updated', `Utilisateur modifié: ${username}`, 'low');
    res.json({ id, username, email, role });
  } catch (error) {
    console.error('Erreur lors de la modification d\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suppression utilisateur (réel)
app.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { id } = req.params;
    await deleteUser(id);
    await createAlert('user_deleted', `Utilisateur supprimé: ID ${id}`, 'medium');
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression d\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Activation/désactivation utilisateur (réel)
app.patch('/users/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { id } = req.params;
    const { active } = req.body;
    await toggleUserStatus(id, active);
    await createAlert('user_status_changed', `Statut utilisateur changé: ID ${id} -> ${active ? 'Actif' : 'Inactif'}`, 'low');
    res.json({ message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès` });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de détection (protégée)
app.get('/detect', authenticateToken, async (req, res) => {
  try {
    const seuil = parseInt(req.query.seuil) || 20;
    const counts = {};

    fs.createReadStream('data/trafic.csv')
      .pipe(csv())
      .on('data', (row) => {
        const ip = row.ip_source;
        counts[ip] = (counts[ip] || 0) + 1;
      })
      .on('end', async () => {
        const ipBloquees = Object.entries(counts)
          .filter(([ip, count]) => count >= seuil)
          .map(([ip]) => ip);

        // Sauvegarder en base de données
        await saveBlockedIPs(ipBloquees);
        await saveDetection(new Date().toISOString(), seuil, ipBloquees);

        // Créer une alerte si des IPs sont détectées
        if (ipBloquees.length > 0) {
          await createAlert(
            'detection', 
            `Détection de ${ipBloquees.length} IP(s) suspecte(s) avec seuil ${seuil}`,
            'medium'
          );
        }

        res.json({ 
          message: `Détection terminée (seuil : ${seuil})`, 
          ipBloquees,
          totalAnalyzed: Object.keys(counts).length
        });
      });
  } catch (error) {
    console.error('Erreur lors de la détection:', error);
    res.status(500).json({ error: 'Erreur lors de la détection' });
  }
});

// Liste IP bloquées (protégée)
app.get('/ip-bloquees', authenticateToken, async (req, res) => {
  try {
    const ips = await getBlockedIPs();
    res.json(ips);
  } catch (error) {
    console.error('Erreur lors de la récupération des IPs bloquées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques avec cache (protégée)
app.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getCachedStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Débloquer une IP (protégée)
app.post('/unblock/:ip', authenticateToken, async (req, res) => {
  try {
    const { ip } = req.params;
    await unblockIP(ip);
    await createAlert('unblock', `IP ${ip} débloquée par ${req.user.username}`, 'low');
    res.json({ message: `IP ${ip} débloquée avec succès` });
  } catch (error) {
    console.error('Erreur lors du déblocage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Alertes (protégées)
app.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const alerts = await getAlerts(limit);
    res.json(alerts);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Export JSON de l'historique (protégé)
app.get('/export/json', authenticateToken, async (req, res) => {
  try {
    const detections = await getDetections(1000);
    const filename = `historique_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(detections);
  } catch (error) {
    console.error('Erreur lors de l\'export JSON:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// Export CSV de l'historique (protégé)
app.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const detections = await getDetections(1000);
    const filename = `historique_${new Date().toISOString().split('T')[0]}.csv`;
    
    const header = 'date,seuil,ip_bloquees,created_at\n';
    const rows = detections.map(entry => {
      return `${entry.date},${entry.seuil},"${entry.ipBloquees.join(';')}",${entry.created_at}`;
    });
    const csvContent = header + rows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// Simulation d'attaque (protégée)
app.get('/simulate', authenticateToken, (req, res) => {
  try {
    const nbLignes = 200;
    const ipsNormales = ['192.168.1.10', '192.168.1.20', '192.168.1.30'];
    const ipsMalveillantes = ['192.168.1.100', '192.168.1.101'];

    // Ajout de la colonne timestamp
    const lignes = ['ip_source,timestamp'];

    // IP normales : peu de requêtes
    for (let i = 0; i < 50; i++) {
      const ip = ipsNormales[Math.floor(Math.random() * ipsNormales.length)];
      // Ajout du timestamp
      lignes.push(`${ip},${new Date().toISOString()}`);
    }

    // IP malveillantes : beaucoup de requêtes
    for (let i = 0; i < 150; i++) {
      const ip = ipsMalveillantes[Math.floor(Math.random() * ipsMalveillantes.length)];
      // Ajout du timestamp
      lignes.push(`${ip},${new Date().toISOString()}`);
    }

    fs.writeFileSync('data/trafic.csv', lignes.join('\n'));
    
    createAlert('simulation', 'Simulation d\'attaque DDoS générée avec timestamps', 'medium');
    
    res.json({ message: '💣 Fichier trafic.csv simulé avec succès (avec timestamps)' });
  } catch (error) {
    console.error('Erreur lors de la simulation:', error);
    res.status(500).json({ error: 'Erreur lors de la simulation' });
  }
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`✅ Bien venu JAMES Backend démarré sur http://localhost:${PORT}`);
  console.log('🔐 Authentification activée - Utilisez admin/password pour vous connecter');
});