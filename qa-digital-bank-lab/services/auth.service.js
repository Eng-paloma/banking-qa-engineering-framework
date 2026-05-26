class AuthService {
  constructor(request) {
    this.request = request;
  }

  login(email, password) {
    return this.request.post('/api/auth/login', {
      data: { email, password }
    });
  }
}

module.exports = { AuthService };
