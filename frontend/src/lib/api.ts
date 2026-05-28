/**
 * Cliente HTTP Axios para comunicação com Backend
 */
import axios, { AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - adiciona token JWT
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('sleepcalm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - renova token se expirado
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('sleepcalm_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          Cookies.set('sleepcalm_token', accessToken, { expires: 1 });
          Cookies.set('sleepcalm_refresh_token', newRefreshToken, { expires: 7 });

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh falhou - redireciona para login
        Cookies.remove('sleepcalm_token');
        Cookies.remove('sleepcalm_refresh_token');
        Cookies.remove('sleepcalm_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),
};

export const dashboardAPI = {
  getKPIs: (params?: any) => api.get('/dashboard/kpis', { params }),
  getFull: (params?: any) => api.get('/dashboard/full', { params }),
  getMonthlyEvolution: (params?: any) => api.get('/dashboard/monthly-evolution', { params }),
  getReasonDistribution: (params?: any) => api.get('/dashboard/reason-distribution', { params }),
  getTopSKUs: (params?: any) => api.get('/dashboard/top-skus', { params }),
  getTopSuppliers: (params?: any) => api.get('/dashboard/top-suppliers', { params }),
  getTopCarriers: (params?: any) => api.get('/dashboard/top-carriers', { params }),
  getStatusDistribution: (params?: any) => api.get('/dashboard/status-distribution', { params }),
  getChannelDistribution: (params?: any) => api.get('/dashboard/channel-distribution', { params }),
  getSLAPerformance: (params?: any) => api.get('/dashboard/sla-performance', { params }),
  getMonthlyLoss: (params?: any) => api.get('/dashboard/monthly-loss', { params }),
  getOperationalPerformance: (params?: any) => api.get('/dashboard/operational-performance', { params }),
};

export const devolutionAPI = {
  list: (params?: any) => api.get('/devolutions', { params }),
  getById: (id: string) => api.get(`/devolutions/${id}`),
  create: (data: any) => api.post('/devolutions', data),
  update: (id: string, data: any) => api.put(`/devolutions/${id}`, data),
  updateStatus: (id: string, data: any) => api.patch(`/devolutions/${id}/status`, data),
  assign: (id: string, assignedToId: string) => api.patch(`/devolutions/${id}/assign`, { assignedToId }),
  remove: (id: string) => api.delete(`/devolutions/${id}`),
  getTimeline: (id: string) => api.get(`/devolutions/${id}/timeline`),
  addComment: (id: string, data: any) => api.post(`/devolutions/${id}/comments`, data),
  getComments: (id: string) => api.get(`/devolutions/${id}/comments`),
  getStats: () => api.get('/devolutions/stats'),
};

export const skuAPI = {
  list: (params?: any) => api.get('/skus', { params }),
  search: (q: string) => api.get('/skus/search', { params: { q } }),
  getById: (id: string) => api.get(`/skus/${id}`),
  create: (data: any) => api.post('/skus', data),
  update: (id: string, data: any) => api.put(`/skus/${id}`, data),
  remove: (id: string) => api.delete(`/skus/${id}`),
};

export const financialAPI = {
  list: (params?: any) => api.get('/financial', { params }),
  getSummary: (params?: any) => api.get('/financial/summary', { params }),
  getFlow: (params?: any) => api.get('/financial/flow', { params }),
  getById: (id: string) => api.get(`/financial/${id}`),
  create: (data: any) => api.post('/financial', data),
  approve: (id: string) => api.patch(`/financial/${id}/approve`),
  remove: (id: string) => api.delete(`/financial/${id}`),
};

export const userAPI = {
  list: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  updatePermissions: (id: string, permissions: string[]) =>
    api.patch(`/users/${id}/permissions`, { permissions }),
  toggleActive: (id: string) => api.patch(`/users/${id}/activate`),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const supplierAPI = {
  list: (params?: any) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
};

export const carrierAPI = {
  list: (params?: any) => api.get('/carriers', { params }),
  getById: (id: string) => api.get(`/carriers/${id}`),
  create: (data: any) => api.post('/carriers', data),
  update: (id: string, data: any) => api.put(`/carriers/${id}`, data),
  remove: (id: string) => api.delete(`/carriers/${id}`),
};

export const customerAPI = {
  list: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
};

export const technicalAPI = {
  list: (params?: any) => api.get('/technical', { params }),
  getById: (id: string) => api.get(`/technical/${id}`),
  create: (data: any) => api.post('/technical', data),
  update: (id: string, data: any) => api.put(`/technical/${id}`, data),
  approve: (id: string, data?: any) => api.patch(`/technical/${id}/approve`, data ?? {}),
  reject: (id: string, data?: any) => api.patch(`/technical/${id}/reject`, data ?? {}),
};

export const lalamoveAPI = {
  list: (params?: any) => api.get('/lalamove', { params }),
  getStats: () => api.get('/lalamove/stats'),
  getById: (id: string) => api.get(`/lalamove/${id}`),
  create: (data: any) => api.post('/lalamove', data),
  updateStatus: (id: string, data: any) => api.patch(`/lalamove/${id}/status`, data),
  remove: (id: string) => api.delete(`/lalamove/${id}`),
};

export const donationAPI = {
  list: (params?: any) => api.get('/donations', { params }),
  getById: (id: string) => api.get(`/donations/${id}`),
  create: (data: any) => api.post('/donations', data),
  approve: (id: string, data: any) => api.patch(`/donations/${id}/approve`, data),
  update: (id: string, data: any) => api.put(`/donations/${id}`, data),
};

export const notificationAPI = {
  list: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

export const auditAPI = {
  list: (params?: any) => api.get('/audit', { params }),
  getSummary: () => api.get('/audit/summary'),
};

export const attachmentAPI = {
  list: (devolutionId: string) => api.get(`/attachments/devolution/${devolutionId}`),
  upload: (devolutionId: string, formData: FormData) =>
    api.post(`/attachments/devolution/${devolutionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  remove: (id: string) => api.delete(`/attachments/${id}`),
};

export const fiscalAPI = {
  list: (params?: any) => api.get('/fiscal', { params }),
  getByDevolution: (devolutionId: string) => api.get(`/fiscal/devolution/${devolutionId}`),
  getById: (id: string) => api.get(`/fiscal/${id}`),
  create: (devolutionId: string, formData: FormData) =>
    api.post(`/fiscal/${devolutionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  remove: (id: string) => api.delete(`/fiscal/${id}`),
};

export const reportAPI = {
  devolutions: (params?: any) => api.get('/reports/devolutions', { params, responseType: 'blob' }),
  financial: (params?: any) => api.get('/reports/financial', { params, responseType: 'blob' }),
  sla: (params?: any) => api.get('/reports/sla', { params, responseType: 'blob' }),
  operational: (params?: any) => api.get('/reports/operational', { params, responseType: 'blob' }),
  // Unified generate method used by the reports page
  generate: (reportId: string, format: 'pdf' | 'excel', params?: any) =>
    api.get(`/reports/${reportId}`, { params: { ...params, format }, responseType: 'blob' }),
};

export default api;
