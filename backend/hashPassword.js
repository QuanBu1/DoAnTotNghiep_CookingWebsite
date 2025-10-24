const bcrypt = require('bcryptjs');

async function hashMyPassword() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt); // Thay "123456" bằng mật khẩu bạn muốn
    console.log(hashedPassword);
}

hashMyPassword();