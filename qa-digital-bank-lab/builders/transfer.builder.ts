export type TransferPayload = {
  toAccount: string;
  amount: number;
};

export class TransferBuilder {
  private payload: TransferPayload = {
    toAccount: 'ACC-2002',
    amount: 100
  };

  withDestination(accountId: string): this {
    this.payload.toAccount = accountId;
    return this;
  }

  withAmount(amount: number): this {
    this.payload.amount = amount;
    return this;
  }

  build(): TransferPayload {
    return { ...this.payload };
  }
}
