class TransferBuilder {
  constructor() {
    this.payload = {
      toAccount: 'ACC-2002',
      amount: 100
    };
  }

  withDestination(accountId) {
    this.payload.toAccount = accountId;
    return this;
  }

  withAmount(amount) {
    this.payload.amount = amount;
    return this;
  }

  build() {
    return { ...this.payload };
  }
}

module.exports = { TransferBuilder };
