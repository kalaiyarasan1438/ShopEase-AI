import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@services/authService';
import toast from 'react-hot-toast';

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('accessToken',  data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authService.register(payload);
      if (data.accessToken) {
        localStorage.setItem('accessToken',  data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginWithOAuth = createAsyncThunk(
  'auth/oauthLogin',
  async ({ provider = 'google', idToken }, { rejectWithValue }) => {
    try {
      const data = await authService.oauthGoogle(idToken);
      localStorage.setItem('accessToken',  data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || `${provider} sign-in failed`);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('refreshToken');
      const data  = await authService.refresh(token);
      localStorage.setItem('accessToken', data.accessToken);
      return data;
    } catch (err) {
      // Only remove auth tokens — do not nuke unrelated localStorage keys
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return rejectWithValue('Session expired');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getCurrentUser();
    } catch (err) {
      // Do NOT logout here — let the Axios interceptor handle token refresh.
      // Only signal failure so callers know initialization is done.
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  user:              null,
  accessToken:       localStorage.getItem('accessToken') || null,
  isAuthenticated:   !!localStorage.getItem('accessToken'),
  isLoading:         false,
  error:             null,
  authInitialized:   !localStorage.getItem('accessToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      state.authInitialized = true; // stay initialized so routes don't hang
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    clearError(state) {
      state.error = null;
    },
    setCredentials(state, action) {
      state.user            = action.payload.user;
      state.accessToken     = action.payload.accessToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload.user;
        state.accessToken     = action.payload.accessToken;
        state.isAuthenticated = true;
        state.authInitialized = true;
        toast.success(`Welcome back, ${action.payload.user.firstName}!`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
        toast.error(action.payload);
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { user, accessToken } = action.payload;
        if (accessToken) {
          // Normal shopper
          state.user            = user;
          state.accessToken     = accessToken;
          state.isAuthenticated = true;
          state.authInitialized = true;
          toast.success('Account created successfully!');
        } else {
          // Pending vendor — not authenticated yet
          state.isAuthenticated = false;
          state.authInitialized = true;
          toast.success('Registration successful! Your vendor account is awaiting admin approval. You will be notified once approved.');
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
        toast.error(action.payload);
      });

    // Fetch current user (called on app startup)
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        // Keep authInitialized false while loading so routes wait
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload;
        state.isAuthenticated = true;
        state.authInitialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading       = false;
        state.authInitialized = true;
        state.isAuthenticated = false;
        state.user            = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });

    // Token refresh
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        // Refresh failed — truly log out now
        state.user            = null;
        state.accessToken     = null;
        state.isAuthenticated = false;
        state.authInitialized = true;
      });

    // OAuth login
    builder
      .addCase(loginWithOAuth.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(loginWithOAuth.fulfilled, (state, action) => {
        state.isLoading       = false;
        state.user            = action.payload.user;
        state.accessToken     = action.payload.accessToken;
        state.isAuthenticated = true;
        state.authInitialized = true;
        toast.success(`Welcome back, ${action.payload.user.firstName}!`);
      })
      .addCase(loginWithOAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectCurrentUser     = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading     = (state) => state.auth.isLoading;
export const selectAuthError       = (state) => state.auth.error;
export const selectAuthInitialized = (state) => state.auth.authInitialized;
export const selectUserRole = (state) => {
  const roles = state.auth.user?.roles;
  if (!roles) return null;
  const rawList = Array.isArray(roles) ? roles : Array.from(roles);
  const roleArray = rawList.map(r => typeof r === 'string' ? r : (r?.name || ''));
  if (roleArray.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN')) return 'ADMIN';
  if (roleArray.some(r => r === 'VENDOR' || r === 'ROLE_VENDOR')) return 'VENDOR';
  if (roleArray.some(r => r === 'USER' || r === 'ROLE_USER')) return 'USER';
  return roleArray[0] || null;
};

export default authSlice.reducer;
