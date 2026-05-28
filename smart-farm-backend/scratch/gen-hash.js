const bcrypt = require('bcrypt');
const password = 'adminpassword2026';
bcrypt.hash(password, 12).then(hash => {
    console.log('HASH:' + hash);
});
