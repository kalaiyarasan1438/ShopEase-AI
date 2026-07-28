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
      const existing = state.items.find(i => i.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
        toast.success('Quantity updated in cart');
      } else {
        state.items.push({
          productId:  product.id,
          name:       product.name,
          price:      product.price,
          imageUrl:   product.imageUrl,
          vendorName: product.vendorName,
          quantity,
        });
        toast.success('Added to cart!');
      }
      saveCartToStorage(state.items);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(i => i.productId !== action.payload);
      saveCartToStorage(state.items);
      toast.success('Removed from cart');
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find(i => i.productId === productId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.productId !== productId);
        } else {
          item.quantity = quantity;
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
        state.items     = action.payload.items || [];
        saveCartToStorage(state.items);
      })
      .addCase(fetchCart.rejected, (state) => { state.isLoading = false; });
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems  = (state) => state.cart.items;
export const selectCartCount  = (state) => state.cart.items.reduce((s, i) => s + i.quantity, 0);
export const selectCartTotal  = (state) => state.cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

export default cartSlice.reducer;
