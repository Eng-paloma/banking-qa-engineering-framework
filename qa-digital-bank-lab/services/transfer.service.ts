import { APIRequestContext, APIResponse } from '@playwright/test';

export class TransferService {
  constructor(private readonly request: APIRequestContext) {}

  account(token: string): Promise<APIResponse> {
    return this.request.get('/api/account', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  transactions(token: string): Promise<APIResponse> {
    return this.request.get('/api/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  transfer(token: string, toAccount: string, amount: number): Promise<APIResponse> {
    return this.request.post('/api/transfer', {
      headers: { Authorization: `Bearer ${token}` },
      data: { toAccount, amount }
    });
  }
}
