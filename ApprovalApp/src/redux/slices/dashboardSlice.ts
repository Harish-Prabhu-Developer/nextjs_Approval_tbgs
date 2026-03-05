import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/client";

interface DashboardState {
  counts: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  counts: {},
  loading: false,
  error: null,
};

export const fetchApprovalCounts = createAsyncThunk(
  "dashboard/fetchCounts",
  async (_, { rejectWithValue }) => {
    try {
      return await apiRequest<Record<string, number>>("/api/dashboard/counts");
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch counts");
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
      });
  },
});

export const { setCounts } = dashboardSlice.actions;
export default dashboardSlice.reducer;
