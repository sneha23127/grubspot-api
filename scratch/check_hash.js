const bcrypt = require('bcryptjs');

const hash = '$2b$10$KNs/Hbdo4VbLijbVKc5GU.s79atdOYegSRR/uXi2wz.dTnxeyw/My';
const password = 'Suresh@12';

async function testPassword() {
  const isMatch = await bcrypt.compare(password, hash);
  console.log(`Does '${password}' match the hash?`, isMatch);
}

testPassword();
