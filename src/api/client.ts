const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export type { ApiError };

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.rawRequest('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (response) => {
        if (response.ok) {
          const { accessToken } = await response.json();
          this.setAccessToken(accessToken);
          return accessToken;
        }

        const apiError: ApiError = new Error('Authentication expired. Please log in again.') as ApiError;
        apiError.status = response.status;
        apiError.code = 'AUTH_EXPIRED';
        throw apiError;
      })
      .finally(() => {
        this.refreshPromise = null;
        this.isRefreshing = false;
      });

    return this.refreshPromise;
  }

  private async rawRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      console.log("[apiClient] Request:", url, options);
      return await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (err) {
      console.error("[apiClient] Network error:", err);
      const apiError: ApiError = new Error(
        'Could not connect to server. Please try again later.'
      ) as ApiError;
      apiError.code = 'NETWORK_ERROR';
      throw apiError;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    let response = await this.rawRequest(endpoint, options);

    if (response.status === 401 && !this.isRefreshing) {
      this.isRefreshing = true;

      try {
        const newToken = await this.refreshToken();

        const retryOptions = {
          ...options,
          headers: {
            ...(options.headers as Record<string, string>),
            Authorization: `Bearer ${newToken}`,
          },
        };

        response = await this.rawRequest(endpoint, retryOptions);
      } catch (error: any) {
        this.setAccessToken(null);

        if (error?.code === 'NETWORK_ERROR') {
          throw error;
        }

        const apiError: ApiError = new Error('Authentication expired. Please log in again.') as ApiError;
        apiError.code = 'AUTH_EXPIRED';
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw apiError;
      }
    }

    return this.handleResponse(response);
  }

  async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = 'Network error';
      let errorCode: string | undefined;
      let errorBody: any = null;
      try {
        errorBody = await response.clone().json();
        errorMessage = errorBody.message || errorMessage;
        errorCode = errorBody.code;
      } catch (err) {
        // ignore json parse error
      }
      console.error("[apiClient] Error response:", {
        status: response.status,
        errorMessage,
        errorCode,
        errorBody,
      });
      const apiError: ApiError = new Error(errorMessage) as ApiError;
      apiError.status = response.status;
      apiError.code = errorCode;
      throw apiError;
    }

    // Handle empty body (e.g. DELETE 200/204 with no content)
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log("[apiClient] Success response:", response.status, "(empty body)");
      return null;
    }
    try {
      const data = JSON.parse(text);
      console.log("[apiClient] Success response:", response.status, data);
      return data;
    } catch {
      console.log("[apiClient] Success response:", response.status, "(non-JSON body)");
      return null;
    }
  }

  async register(data: { email?: string; phone?: string; name: string; password: string }) {
    const response = await this.rawRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async login(data: { identifier: string; password: string }) {
    // Use rawRequest to skip the automatic token-refresh logic on 401
    const response = await this.rawRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const parsed = await this.handleResponse(response);
    if (parsed?.accessToken) {
      this.setAccessToken(parsed.accessToken);
    }
    return parsed;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setAccessToken(null);
  }

  async getMe() {
    return this.request('/users/me');
  }

  async updateMe(data: { name?: string; profile?: any }) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getAccounts() {
    return this.request('/accounts');
  }

  async createAccount(data: any) {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAccount(id: string, data: any) {
    return this.request(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(id: string) {
    return this.request(`/accounts/${id}`, { method: 'DELETE' });
  }

  async archiveAccount(id: string) {
    return this.request(`/accounts/${id}/archive`, { method: 'PATCH' });
  }

  async unarchiveAccount(id: string) {
    return this.request(`/accounts/${id}/unarchive`, { method: 'PATCH' });
  }

  async getTransactions() {
    return this.request('/transactions');
  }

  async createTransaction(data: any) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any) {
    return this.request(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }

  async getIncomeSources() {
    return this.request('/income-sources');
  }

  async createIncomeSource(data: any) {
    return this.request('/income-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncomeSource(id: string, data: any) {
    return this.request(`/income-sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteIncomeSource(id: string) {
    return this.request(`/income-sources/${id}`, { method: 'DELETE' });
  }

  async getBudgets() {
    return this.request('/budgets');
  }

  async createBudget(data: any) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: string, data: any) {
    return this.request(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: string) {
    return this.request(`/budgets/${id}`, { method: 'DELETE' });
  }

  async getBudgetCategories(budgetId: string) {
    return this.request(`/budgets/${budgetId}/categories`);
  }

  async createBudgetCategory(budgetId: string, data: any) {
    return this.request(`/budgets/${budgetId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudgetCategory(budgetId: string, categoryId: string, data: any) {
    return this.request(`/budgets/${budgetId}/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBudgetCategory(budgetId: string, categoryId: string) {
    return this.request(`/budgets/${budgetId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  async getGoals() {
    return this.request('/goals');
  }

  async createGoal(data: any) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: string, data: any) {
    return this.request(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: string) {
    return this.request(`/goals/${id}`, { method: 'DELETE' });
  }



  async contributeToGoal(id: string, amount: number) {
    return this.request(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async createNotification(data: { type: string; message: string }) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadNotifications() {
    return this.request('/notifications/unread');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async getAdminTransactions() {
    return this.request('/admin/transactions');
  }

  async updateUserRole(id: string, role: string) {
    return this.request(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteAdminUser(id: string) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  async getAdminAccounts() {
    return this.request('/admin/accounts');
  }

  async getAdminBudgets() {
    return this.request('/admin/budgets');
  }

  async getAdminGoals() {
    return this.request('/admin/goals');
  }

  async bootstrapAuth() {
    try {
      const response = await this.rawRequest('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        this.setAccessToken(null);
        return null;
      }

      const data = await response.json();

      if (data?.accessToken) {
        this.setAccessToken(data.accessToken);
        return data.accessToken;
      }

      this.setAccessToken(null);
      return null;
    } catch {
      this.setAccessToken(null);
      return null;
    }
  }
}

export const apiClient = new ApiClient();