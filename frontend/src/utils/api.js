import axios from 'axios';

/**
 * Centralized API helper
 * All responses follow { success, message, ...data } pattern
 */
const api = {
  // ─── Auth ────────────────────────────────────────────────
  login: (data) => axios.post('/api/auth/login', data),
  register: (data) => axios.post('/api/auth/register', data),
  logout: () => axios.post('/api/auth/logout'),
  getMe: () => axios.get('/api/auth/me'),
  refreshToken: (data) => axios.post('/api/auth/refresh-token', data),

  // ─── Jobs ────────────────────────────────────────────────
  getJobs: (params) => axios.get('/api/jobs', { params }),
  getActiveJobs: () => axios.get('/api/jobs/active'),
  getJob: (id) => axios.get(`/api/jobs/${id}`),
  createJob: (data) => axios.post('/api/jobs', data),
  updateJob: (id, data) => axios.put(`/api/jobs/${id}`, data),
  toggleJob: (id) => axios.patch(`/api/jobs/${id}/toggle`),
  deleteJob: (id) => axios.delete(`/api/jobs/${id}`),

  // ─── Candidates ──────────────────────────────────────────
  getCandidates: (params) => axios.get('/api/candidates', { params }),
  getCandidate: (id) => axios.get(`/api/candidates/${id}`),
  getCandidateStats: () => axios.get('/api/candidates/stats'),
  generateQuestions: (id) => axios.post(`/api/candidates/${id}/generate-questions`),
  deleteCandidate: (id) => axios.delete(`/api/candidates/${id}`),

  // ─── Scan CV ─────────────────────────────────────────────
  scanCV: (formData) => axios.post('/api/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  }),

  // ─── Bulk Scan CVs ───────────────────────────────────────
  bulkScanCVs: (formData) => axios.post('/api/scan/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000
  }),

  // ─── Credits ──────────────────────────────────────────────
  getCreditBalance: () => axios.get('/api/credits/balance'),
  getCreditPlans: () => axios.get('/api/credits/plans'),
  getTransactions: (params) => axios.get('/api/credits/transactions', { params }),
  purchasePlan: (planId) => axios.post('/api/credits/purchase', { planId }),
  customPurchase: (credits) => axios.post('/api/credits/custom-purchase', { credits }),

  // ─── Admin ───────────────────────────────────────────────
  getAdminDashboard: () => axios.get('/api/admin/dashboard'),
  getAdminUsers: (params) => axios.get('/api/admin/users', { params }),
  toggleUserActive: (id) => axios.patch(`/api/admin/users/${id}/toggle-active`),
  updateUserRole: (id, role) => axios.patch(`/api/admin/users/${id}/role`, { role }),
  getAdminCandidates: (params) => axios.get('/api/admin/candidates', { params }),
  getScansOverTime: (params) => axios.get('/api/admin/scans-over-time', { params }),
  getAdminCredits: (params) => axios.get('/api/admin/credits', { params }),
  adminAddCredits: (data) => axios.post('/api/admin/credits/add', data),
  adminRemoveCredits: (data) => axios.post('/api/admin/credits/remove', data),
  getTransactionLogs: (params) => axios.get('/api/admin/transaction-logs', { params }),
};

export default api;
