export type UserCredentials = {
  email: string;
  password: string;
};

export class UserFactory {
  static validAlice(): UserCredentials {
    return { email: 'alice@fakebank.com', password: 'Bank@123' };
  }

  static validBob(): UserCredentials {
    return { email: 'bob@fakebank.com', password: 'Bank@123' };
  }

  static invalidPassword(): UserCredentials {
    return { email: 'alice@fakebank.com', password: 'wrong-password' };
  }

  static sqlInjectionAttempt(): UserCredentials {
    return { email: "' OR 1=1 --", password: "' OR 1=1 --" };
  }
}
