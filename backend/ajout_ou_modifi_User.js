
const bcrypt = require('bcryptjs');
const { createUser, getUserByUsername, updateUser, toggleUserStatus } = require('./database');

async function createOrUpdateJames() {
  const username = 'james';
  const email = 'james@ddos-shield.com';
  const password = 'password'; // Change ici si tu veux un autre mot de passe
  const role = 'admin';
  const hashed = await bcrypt.hash(password, 10);

  const user = await getUserByUsername(username);
  if (!user) {
    await createUser(username, email, hashed, role);
    console.log('Utilisateur james créé avec succès !');
  } else {
    await updateUser(user.id, username, email, role);
    await toggleUserStatus(user.id, true);
    console.log('Utilisateur james mis à jour et activé !');
  }
  process.exit(0);
}

// J'ai galéré ici pour faire marcher la mise à jour..
// Je vérifie si l'utilisateur existe déjà (sinon ça plante)
createOrUpdateJames().catch(e => { console.error(e); process.exit(1); }); 