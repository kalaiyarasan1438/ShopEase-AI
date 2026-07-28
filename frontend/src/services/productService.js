import api from './api';

const productService = {
  getProducts: async (params = {}) => {
    const { data } = await api.get('/api/products', { params });
    return data;
  },

  getProductById: async (id) => {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },

  getCategories: async () => {
    const { data } = await api.get('/api/categories');
    return data;
  },

  searchProducts: async (query) => {
    const { data } = await api.get('/api/products/search', { params: { q: query } });
    return data;
  },

  createProduct: async (payload) => {
    const { data } = await api.post('/api/products', payload);
    return data;
  },

  updateProduct: async (id, payload) => {
    const { data } = await api.put(`/api/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await api.delete(`/api/products/${id}`);
    return data;
  },

  getProductReviews: async (productId, params = {}) => {
    const { data } = await api.get(`/api/products/${productId}/reviews`, { params });
    return data;
  },

  submitReview: async (productId, payload) => {
    const { data } = await api.post(`/api/products/${productId}/reviews`, payload);
    return data;
  },

  getVendorProducts: async (params = {}) => {
    const { data } = await api.get('/api/vendor/products', { params });
    return data;
  },
};

export default productService;
