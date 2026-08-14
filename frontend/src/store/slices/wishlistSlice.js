import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wishlistService from '@services/wishlistService';
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

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await wishlistService.getWishlist();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async (product, { getState, rejectWithValue }) => {
    const state = getState();
    const isWishlisted = state.wishlist.items.some(i => i.id === product.id);
    const isAuthenticated = state.auth?.isAuthenticated;

    try {
      if (isAuthenticated) {
        if (isWishlisted) {
          await wishlistService.removeFromWishlist(product.id);
          toast.success('Removed from wishlist');
          return { product, action: 'removed' };
        } else {
          await wishlistService.addToWishlist(product.id);
          toast.success('Added to wishlist ❤️');
          return { product, action: 'added' };
        }
      } else {
        if (isWishlisted) {
          toast.success('Removed from wishlist');
          return { product, action: 'removed' };
        } else {
          toast.success('Added to wishlist ❤️');
          return { product, action: 'added' };
        }
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
      return rejectWithValue(err.response?.data?.message || 'Failed to update wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: loadFromStorage(),
    isLoading: false,
  },
  reducers: {
    clearWishlist(state) {
      state.items = [];
      localStorage.removeItem('shopeasy_wishlist');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload || [];
        saveToStorage(state.items);
      })
      .addCase(fetchWishlist.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { product, action: actType } = action.payload;
        if (actType === 'removed') {
          state.items = state.items.filter(i => i.id !== product.id);
        } else if (actType === 'added') {
          if (!state.items.some(i => i.id === product.id)) {
            state.items.push(product);
          }
        }
        saveToStorage(state.items);
      })
      .addCase('auth/logout', (state) => {
        state.items = [];
        localStorage.removeItem('shopeasy_wishlist');
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;

export const selectWishlistItems  = (state) => state.wishlist.items;
export const selectWishlistCount  = (state) => state.wishlist.items.length;
export const selectIsWishlisted   = (state, productId) =>
  state.wishlist.items.some(i => i.id === productId);

export default wishlistSlice.reducer;
