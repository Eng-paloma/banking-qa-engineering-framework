class UserFactory {
  static validAlice() {
    return { email: 'alice@fakebank.com', password: 'Bank@123' };
  }

  static invalidPassword() {
    return { email: 'alice@fakebank.com', password: 'wrong-password' };
  }

  static sqlInjectionAttempt() {
    return { email: "' OR 1=1 --", password: "' OR 1=1 --" };
  }
}

module.exports = { UserFactory };
