const { initDatabase, getUserByUsername, createUser, updateUserPassword } = require('./database');
const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

async function resetAdminUser() {
  try {
    console.log('🔄 Initialisation de la base de données...');
    await initDatabase();

    console.log(`🔍 Vérification de l'utilisateur "${ADMIN_USERNAME}"...`);
    let admin = await getUserByUsername(ADMIN_USERNAME);

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (admin) {
      console.log(`✅ L'utilisateur "${ADMIN_USERNAME}" existe. Réinitialisation du mot de passe...`);
      await updateUserPassword(admin.id, hashedPassword);
      console.log('🔑 Mot de passe réinitialisé avec succès.');
    } else {
      console.log(`🤷 L'utilisateur "${ADMIN_USERNAME}" n'existe pas. Création...`);
      await createUser(ADMIN_USERNAME, 'admin@system.local', hashedPassword, 'admin');
      console.log('✅ Utilisateur "admin" créé avec succès.');
    }

    console.log('\n🎉 Opération terminée.');
    console.log(`Vous pouvez maintenant vous connecter avec :`);
    console.log(`   - Nom d'utilisateur : ${ADMIN_USERNAME}`);
    console.log(`   - Mot de passe : ${ADMIN_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation de l\'utilisateur admin :', error);
  }
}

resetAdminUser(); 