import React, { useState, useEffect } from 'react';
import './UsersPage.css';

const UsersPage = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'analyst',
    password: ''
  });

  const roles = [
    { value: 'admin', label: '👑 Administrateur', description: 'Accès complet à toutes les fonctionnalités' },
    { value: 'analyst', label: '🔍 Analyste', description: 'Peut analyser et gérer les détections' },
    { value: 'observer', label: '👁️ Observateur', description: 'Peut seulement consulter les rapports' }
  ];

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setMessage('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Créer un nouvel utilisateur
  const createUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setMessage('Utilisateur créé avec succès !');
        setShowCreateForm(false);
        setNewUser({ username: '', email: '', role: 'analyst', password: '' });
        loadUsers();
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Modifier un utilisateur
  const updateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingUser)
      });

      if (response.ok) {
        setMessage('Utilisateur modifié avec succès !');
        setEditingUser(null);
        loadUsers();
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setMessage('Utilisateur supprimé avec succès !');
        loadUsers();
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Activer/désactiver un utilisateur
  const toggleUserStatus = async (userId, currentStatus) => {
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !currentStatus })
      });

      if (response.ok) {
        setMessage(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès !`);
        loadUsers();
      } else {
        const error = await response.json();
        setMessage(error.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'analyst': return '🔍';
      case 'observer': return '👁️';
      default: return '👤';
    }
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>👥 Gestion des utilisateurs</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Ajouter un utilisateur
        </button>
      </div>

      {message && (
        <div className="message">
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>➕ Créer un nouvel utilisateur</h2>
              <button onClick={() => setShowCreateForm(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={createUser} className="user-form">
              <div className="form-group">
                <label>Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mot de passe *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de modification */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✏️ Modifier l'utilisateur</h2>
              <button onClick={() => setEditingUser(null)} className="close-btn">×</button>
            </div>
            <form onSubmit={updateUser} className="user-form">
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div className="users-list">
        {loading ? (
          <div className="loading">Chargement des utilisateurs...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className={`user-card ${!user.active ? 'inactive' : ''}`}>
                <div className="user-header">
                  <div className="user-avatar">
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="user-info">
                    <h3>{user.username}</h3>
                    <p className="user-email">{user.email}</p>
                    <span className={`user-role ${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="user-status">
                    <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                      {user.active ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </div>
                </div>
                <div className="user-details">
                  <p><strong>Créé le :</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                  <p><strong>Dernière connexion :</strong> {user.last_login ? new Date(user.last_login).toLocaleString() : 'Jamais'}</p>
                </div>
                <div className="user-actions">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="btn btn-small btn-secondary"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.active)}
                    className={`btn btn-small ${user.active ? 'btn-warning' : 'btn-success'}`}
                  >
                    {user.active ? '❌ Désactiver' : '✅ Activer'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="btn btn-small btn-danger"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage; 