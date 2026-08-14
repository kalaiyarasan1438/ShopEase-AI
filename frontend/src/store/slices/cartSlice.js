import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '@services/cartService';
import toast from 'react-hot-toast';

// Persist cart to localStorage for guest users
const loadCartFromStorage = () => {
  try {
    const raw = localStorage.getItem('shopeasy_cart');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveCartToStorage = (items) => {
  try { localStorage.setItem('shopeasy_cart', JSON.stringify(items)); }
  catch {}
};

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try { return await cartService.getCart(); }
    catch (err) { return rejectWithValue(err.response?.data?.message); }
  }
);

export const syncCartToServer = createAsyncThunk(
  'cart/sync',
  async (items, { rejectWithValue }) => {
    try { return await cartService.syncCart(items); }
    catch (err) { return rejectWithValue(err.response?.data?.message); }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:     loadCartFromStorage(),
    isLoading: false,
    error:     null,
  },
  reducers: {
    addToCart(state, action) {
      const { product, quantity = 1 } = action.payload;
      if (!product || !product.id) return;
      const productId = Number(product.id);
      const existing = state.items.find(i => Number(i.productId || i.id) === productId);
      const numQty = Math.max(1, Number(quantity) || 1);

      if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + numQty;
        toast.success('Quantity updated in cart');
      } else {
        state.items.push({
          productId:  productId,
          id:         productId,
          name:       product.name || 'Product',
          price:      Number(product.price) || 0,
          imageUrl:   product.imageUrl || '',
          vendorName: product.vendorName || 'ShopEasy Store',
          stockQty:   product.stockQty ?? 99,
          quantity:   numQty,
        });
        toast.success('Added to cart!');
      }
      saveCartToStorage(state.items);
    },
    removeFromCart(state, action) {
      const targetId = Number(action.payload);
      state.items = state.items.filter(i => Number(i.productId || i.id) !== targetId);
      saveCartToStorage(state.items);
      toast.success('Removed from cart');
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const targetId = Number(productId);
      const item = state.items.find(i => Number(i.productId || i.id) === targetId);
      if (item) {
        const numQty = Number(quantity);
        if (numQty <= 0) {
          state.items = state.items.filter(i => Number(i.productId || i.id) !== targetId);
        } else {
          item.quantity = numQty;
        }
        saveCartToStorage(state.items);
      }
    },
    clearCart(state) {
      state.items = [];
      localStorage.removeItem('shopeasy_cart');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        const fetched = action.payload.items || [];
        state.items = fetched.map(i => ({
          productId: Number(i.productId || i.id),
          id:        Number(i.productId || i.id),
          name:      i.name || i.productName || 'Product',
          price:     Number(i.price || i.unitPrice) || 0,
          imageUrl:  i.imageUrl || '',
          quantity:  Number(i.quantity) || 1,
        }));
        saveCartToStorage(state.items);
      })
      .addCase(fetchCart.rejected, (state) => { state.isLoading = false; })
      .addCase('auth/logout', (state) => {
        state.items = [];
        localStorage.removeItem('shopeasy_cart');
      });
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems  = (state) => state.cart.items || [];
export const selectCartCount  = (state) => (state.cart.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
export const selectCartTotal  = (state) => (state.cart.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

export default cartSlice.reducer;
