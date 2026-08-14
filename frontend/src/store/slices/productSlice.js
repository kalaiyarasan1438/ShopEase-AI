import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '@services/productService';

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await productService.getProducts(params);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await productService.getProductById(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Product not found');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getCategories();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items:           [],
    selectedProduct: null,
    categories:      [],
    pagination: {
      page:        0,
      size:        12,
      totalPages:  0,
      totalElements: 0,
    },
    filters: {
      category:  '',
      categoryId: '',
      minPrice:  '',
      maxPrice:  '',
      ratingMin: '',
      sortBy:    'createdAt',
      sortDir:   'desc',
      search:    '',
    },
    isLoading:       false,
    isDetailLoading: false,
    error:           null,
  },
  reducers: {
    setFilters(state, action) {
      state.filters    = { ...state.filters, ...action.payload };
      state.pagination = { ...state.pagination, page: 0 };
    },
    clearFilters(state) {
      state.filters = { category: '', categoryId: '', minPrice: '', maxPrice: '', ratingMin: '', sortBy: 'createdAt', sortDir: 'desc', search: '' };
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items     = action.payload.content;
        state.pagination = {
          page:          action.payload.number,
          size:          action.payload.size,
          totalPages:    action.payload.totalPages,
          totalElements: action.payload.totalElements,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; });

    builder
      .addCase(fetchProductById.pending, (state) => { state.isDetailLoading = true; })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.isDetailLoading = false; state.selectedProduct = action.payload; })
      .addCase(fetchProductById.rejected, (state, action) => { state.isDetailLoading = false; state.error = action.payload; });

    builder
      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; });
  },
});

export const { setFilters, clearFilters, setPage } = productSlice.actions;

export const selectProducts        = (state) => state.products.items;
export const selectSelectedProduct = (state) => state.products.selectedProduct;
export const selectCategories      = (state) => state.products.categories;
export const selectProductFilters  = (state) => state.products.filters;
export const selectPagination      = (state) => state.products.pagination;
export const selectProductsLoading = (state) => state.products.isLoading;

export default productSlice.reducer;
