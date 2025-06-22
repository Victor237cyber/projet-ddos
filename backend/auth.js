const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getUserByUsername } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise_2024';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Connexion utilisateur (SQLite)
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    if (!user.active) {
      return res.status(403).json({ error: 'Utilisateur désactivé' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { authenticateToken, login }; 