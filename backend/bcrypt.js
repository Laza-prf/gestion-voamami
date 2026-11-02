const bcrypt = require('bcryptjs');

// Le mot de passe à hasher
const password = '@linux69';

// Générer le hash
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('═══════════════════════════════════════════');
console.log('🔑 HASH GÉNÉRÉ POUR LE MOT DE PASSE');
