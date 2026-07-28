import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem('shopeasy_wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveToStorage = (items) => {
  try { localStorage.setItem('shopeasy_wishlist', JSON.stringify(items)); }
  catch {}
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: loadFromStorage(),
  },
  reducers: {
    toggleWishlist(state, action) {
      const product  = action.payload;
      const existing = state.items.find(i => i.id === product.id);
      if (existing) {
        state.items = state.items.filter(i => i.id !== product.id);
        toast.success('Removed from wishlist');
      } else {
        state.items.push(product);
        toast.success('Added to wishlist ❤️');
      }
      saveToStorage(state.items);
    },
    clearWishlist(state) {
      state.items = [];
      localStorage.removeItem('shopeasy_wishlist');
    },
  },
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;

export const selectWishlistItems  = (state) => state.wishlist.items;
export const selectWishlistCount  = (state) => state.wishlist.items.length;
export const selectIsWishlisted   = (state, productId) =>
  state.wishlist.items.some(i => i.id === productId);

export default wishlistSlice.reducer;
