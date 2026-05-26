class TransferService {
  constructor(request) {
    this.request = request;
  }

  account(token) {
    return this.request.get('/api/account', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  transfer(token, toAccount, amount) {
    return this.request.post('/api/transfer', {
      headers: { Authorization: `Bearer ${token}` },
      data: { toAccount, amount }
    });
  }
}

module.exports = { TransferService };
