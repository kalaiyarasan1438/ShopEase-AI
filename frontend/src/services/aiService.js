import axios from 'axios';
import api from './api';

const AI_BASE = import.meta.env.VITE_AI_API_URL || '';

const aiApi = axios.create({
  baseURL: AI_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

const aiService = {
  // AI chatbot message
  sendMessage: async (message, conversationHistory = []) => {
    const { data } = await aiApi.post('/ai/chat', {
      message,
      history: conversationHistory,
    });
    return data;
  },

  // Personalized product recommendations
  getRecommendations: async (userId, productId = null) => {
    const { data } = await aiApi.get('/ai/recommendations', {
      params: { user_id: userId, product_id: productId },
    });
    return data;
  },

  // Smart search with semantic understanding
  smartSearch: async (query) => {
    const { data } = await aiApi.get('/ai/search', {
      params: { q: query },
    });
    return data;
  },

  // Search suggestions (autocomplete)
  getSuggestions: async (query) => {
    const { data } = await aiApi.get('/ai/suggestions', {
      params: { q: query },
    });
    return data;
  },
};

export default aiService;
