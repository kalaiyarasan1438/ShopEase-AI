import api from './api';

const cartService = {
  getCart: async () => {
    const { data } = await api.get('/api/cart');
    return data;
  },
  addItem: async (productId, quantity) => {
    const { data } = await api.post('/api/cart/items', { productId, quantity });
    return data;
  },
  updateItem: async (itemId, quantity) => {
    const { data } = await api.put(`/api/cart/items/${itemId}`, { quantity });
    return data;
  },
  removeItem: async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}`);
  },
  clearCart: async () => {
    await api.delete('/api/cart');
  },
  syncCart: async (items) => {
    const { data } = await api.post('/api/cart/sync', { items });
    return data;
  },
};
export default cartService;
