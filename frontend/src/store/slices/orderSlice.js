import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import toast from 'react-hot-toast';

export const placeOrder = createAsyncThunk(
  'orders/place',
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/orders', orderData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to place order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMine',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/orders', { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/orders/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items:         [],
    selectedOrder: null,
    pagination:    { page: 0, totalPages: 0, totalElements: 0 },
    isLoading:     false,
    isPlacing:     false,
    error:         null,
    lastPlacedOrder: null,
  },
  reducers: {
    clearLastOrder(state) { state.lastPlacedOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending,  (state) => { state.isPlacing = true; state.error = null; })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isPlacing      = false;
        state.lastPlacedOrder = action.payload;
        toast.success('Order placed successfully! 🎉');
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isPlacing = false;
        state.error     = action.payload;
        toast.error(action.payload || 'Failed to place order');
      });

    builder
      .addCase(fetchMyOrders.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items     = action.payload.content;
        state.pagination = {
          page:          action.payload.number,
          totalPages:    action.payload.totalPages,
          totalElements: action.payload.totalElements,
        };
      })
      .addCase(fetchMyOrders.rejected,  (state) => { state.isLoading = false; });

    builder
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
      });
  },
});

export const { clearLastOrder } = orderSlice.actions;

export const selectOrders       = (state) => state.orders.items;
export const selectSelectedOrder = (state) => state.orders.selectedOrder;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectIsPlacing    = (state) => state.orders.isPlacing;
export const selectLastOrder    = (state) => state.orders.lastPlacedOrder;

export default orderSlice.reducer;
