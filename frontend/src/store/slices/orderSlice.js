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
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to place order';
      return rejectWithValue(msg);
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
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch orders';
      return rejectWithValue(msg);
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
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch order';
      return rejectWithValue(msg);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/api/orders/${id}/cancel`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to cancel order';
      return rejectWithValue(msg);
    }
  }
);

export const requestRefund = createAsyncThunk(
  'orders/requestRefund',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/api/orders/${id}/refund`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : null) || 'Failed to request refund';
      return rejectWithValue(msg);
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
    isSelectedOrderLoading: false,
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
        state.items     = action.payload.content || [];
        state.pagination = {
          page:          action.payload.number || 0,
          totalPages:    action.payload.totalPages || 0,
          totalElements: action.payload.totalElements || 0,
        };
      })
      .addCase(fetchMyOrders.rejected,  (state) => { state.isLoading = false; });

    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isSelectedOrderLoading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isSelectedOrderLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state) => {
        state.isSelectedOrderLoading = false;
      });

    builder
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.items = state.items.map(o => o.id === action.payload.id ? action.payload : o);
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        toast.success('Order cancelled successfully. Stock restored!');
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        toast.error(action.payload || 'Could not cancel order');
      });

    builder
      .addCase(requestRefund.fulfilled, (state, action) => {
        state.items = state.items.map(o => o.id === action.payload.id ? action.payload : o);
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        toast.success(`Refund requested for Order #${action.payload.id}! Vendor notified.`);
      })
      .addCase(requestRefund.rejected, (state, action) => {
        toast.error(action.payload || 'Could not request refund');
      })
      .addCase('auth/logout', (state) => {
        state.items = [];
        state.selectedOrder = null;
        state.pagination = { page: 0, totalPages: 0, totalElements: 0 };
        state.lastPlacedOrder = null;
        state.error = null;
      });
  },
});

export const { clearLastOrder } = orderSlice.actions;

export const selectOrders       = (state) => state.orders.items;
export const selectSelectedOrder = (state) => state.orders.selectedOrder;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectIsSelectedOrderLoading = (state) => state.orders.isSelectedOrderLoading;
export const selectIsPlacing    = (state) => state.orders.isPlacing;
export const selectLastOrder    = (state) => state.orders.lastPlacedOrder;

export default orderSlice.reducer;
