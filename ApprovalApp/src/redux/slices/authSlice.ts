import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/client";
import {
  ACCESS_TOKEN_KEY,
  REMEMBER_ME_KEY,
  REMEMBERED_USERNAME_KEY,
  USER_DATA_KEY,
} from "../../constants/storage";

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
}

type LoginPayload = {
  username: string;
  password: string;
  rememberMe: boolean;
  fcmToken?: string | null;
};

type LoginResponse = {
  user: User;
  token: string;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  hydrated: false,
  error: null,
};

export const hydrateAuth = createAsyncThunk(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const [token, userRaw] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (!token || !userRaw) {
        return { token: null, user: null };
      }

      return {
        token,
        user: JSON.parse(userRaw) as User,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to restore session");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ username, password, rememberMe, fcmToken }: LoginPayload, { rejectWithValue }) => {
    try {
      const data = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: { username, password, fcmToken },
      });

      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user)),
        AsyncStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false"),
        rememberMe
          ? AsyncStorage.setItem(REMEMBERED_USERNAME_KEY, data.user.username)
          : AsyncStorage.removeItem(REMEMBERED_USERNAME_KEY),
      ]);

      return data;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(USER_DATA_KEY),
    AsyncStorage.removeItem(REMEMBER_ME_KEY),
    AsyncStorage.removeItem(REMEMBERED_USERNAME_KEY),
  ]);
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.hydrated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = Boolean(action.payload.token && action.payload.user);
      })
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.loading = false;
        state.hydrated = true;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.hydrated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
