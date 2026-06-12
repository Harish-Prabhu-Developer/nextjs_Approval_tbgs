import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/client";

interface DashboardState {
  counts: Record<string, number>;
  cards: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  counts: {},
  cards: [],
  loading: false,
  error: null,
};

export const fetchApprovalCounts = createAsyncThunk(
  "dashboard/fetchCounts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth?.token;
      return await apiRequest<Record<string, number>>("/api/dashboard/counts", { token });
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch counts");
    }
  }
);

export const fetchDashboardCards = createAsyncThunk(
  "dashboard/fetchCards",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth?.token;
      return await apiRequest<any[]>("/api/dashboard/cards", { token });
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch cards");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setCounts: (state, action) => {
      state.counts = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovalCounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.counts = action.payload;
      })
      .addCase(fetchApprovalCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDashboardCards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDashboardCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCounts } = dashboardSlice.actions;
export default dashboardSlice.reducer;
