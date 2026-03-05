import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/client";

interface ApprovalState {
  records: any[];
  currentRecord: any | null;
  conversations: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalState = {
  records: [],
  currentRecord: null,
  conversations: [],
  loading: false,
  error: null,
};

export const fetchApprovalRecords = createAsyncThunk(
  "approval/fetchRecords",
  async (approvalType: string, { rejectWithValue }) => {
    try {
      return await apiRequest<any[]>(`/api/approvals/${approvalType}`);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch records");
    }
  }
);

export const fetchApprovalDetail = createAsyncThunk(
  "approval/fetchDetail",
  async ({ type, id }: { type: string; id: string }, { rejectWithValue }) => {
    try {
      return await apiRequest<any>(`/api/approvals/${type}/${id}`);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch detail");
    }
  }
);

export const fetchConversation = createAsyncThunk(
  "approval/fetchConversation",
  async (poRefNo: string, { rejectWithValue }) => {
    try {
      return await apiRequest<any[]>(`/api/approvals/conversation?poRefNo=${encodeURIComponent(poRefNo)}`);
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch conversation");
    }
  }
);

export const updateApprovalStatus = createAsyncThunk(
  "approval/updateStatus",
  async (payload: any, { rejectWithValue }) => {
    try {
      return await apiRequest<any>("/api/approvals/status", {
        method: "POST",
        body: payload,
      });
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to update status");
    }
  }
);

const approvalSlice = createSlice({
  name: "approval",
  initialState,
  reducers: {
    clearCurrentRecord: (state) => {
      state.currentRecord = null;
      state.conversations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovalRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.records = [];
      })
      .addCase(fetchApprovalRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchApprovalRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchApprovalDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecord = action.payload;
      })
      .addCase(fetchApprovalDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentRecord } = approvalSlice.actions;
export default approvalSlice.reducer;
