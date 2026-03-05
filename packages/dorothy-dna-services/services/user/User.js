const service = require(".");

class User {
    async requestRecoveryCode(email) {
        return await service.requestRecoveryCode(email);
    }
    async verifyRecoveryCode(code) {
        return await service.verifyRecoveryCode(code);
    }

    async changePasswordUsingRecoveryCode(password, code) {
        return await service.changePasswordUsingRecoveryCode(password, code);
    }

    async changePassword(user, password) {
        return await service.changePassword(user, password);
    }
}

const singletonInstance = new User();
module.exports = singletonInstance;