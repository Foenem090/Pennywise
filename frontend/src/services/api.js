import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const apiService = {
  // Cryptocurrency Markets
  async getCoins(limit = 6) {
    try {
      const response = await apiClient.get('/coins', { params: { limit } });
      return response.data;
    } catch (error) {
      console.warn('Backend API request failed, falling back to local dataset:', error?.message);
      throw error;
    }
  },

  async searchCoins(query, limit = 12) {
    const response = await apiClient.get('/coins/search', { params: { q: query, limit } });
    return response.data;
  },

  // Newsletter Subscription
  async subscribeNewsletter(email) {
    const response = await apiClient.post('/newsletter/subscribe', { email });
    return response.data;
  },

  // Contact Inquiries
  async submitContact(data) {
    const response = await apiClient.post('/contact', data);
    return response.data;
  },

  // APY Yield Calculator
  async getCalculatorRates() {
    const response = await apiClient.get('/calculator/rates');
    return response.data;
  },

  async estimateReturns(asset, amount) {
    const response = await apiClient.post('/calculator/estimate', { asset, amount });
    return response.data;
  },
};

export default apiClient;
