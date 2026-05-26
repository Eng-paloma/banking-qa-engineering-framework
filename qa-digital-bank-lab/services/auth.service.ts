import { APIRequestContext, APIResponse } from '@playwright/test';

export class AuthService {
  constructor(private readonly request: APIRequestContext) {}

  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', {
      data: { email, password }
    });
  }
}
