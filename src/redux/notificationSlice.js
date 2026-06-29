import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20, search = '', type = '', priority = '' }, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications', {
        params: { page, limit, search, type, priority }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications/count');
      return res.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAsReadAsync = createAsyncThunk(
  'notifications/markAsReadAsync',
  async (ids, { rejectWithValue, dispatch }) => {
    try {
      await api.patch('/notifications/read', { ids });
      dispatch(fetchUnreadCount());
      return ids;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsReadAsync = createAsyncThunk(
  'notifications/markAllAsReadAsync',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.patch('/notifications/read-all');
      dispatch(fetchUnreadCount());
      return null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotificationAsync = createAsyncThunk(
  'notifications/deleteNotificationAsync',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/notifications/${id}`);
      dispatch(fetchUnreadCount());
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification');
    }
  }
);

export const deleteAllNotificationsAsync = createAsyncThunk(
  'notifications/deleteAllNotificationsAsync',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.delete('/notifications/all');
      dispatch(fetchUnreadCount());
      return null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete all notifications');
    }
  }
);

export const fetchSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications/settings');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

export const updateSettingsAsync = createAsyncThunk(
  'notifications/updateSettingsAsync',
  async (settings, { rejectWithValue }) => {
    try {
      const res = await api.put('/notifications/settings', settings);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const subscribePushAsync = createAsyncThunk(
  'notifications/subscribePush',
  async (subscription, { rejectWithValue }) => {
    try {
      const res = await api.post('/notifications/subscribe', { subscription });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to subscribe push');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    totalPages: 1,
    currentPage: 1,
    total: 0,
    settings: {
      enabled: true,
      desktop: true,
      sound: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      customSound: 'default',
      dnd: false,
      mentionOnly: false
    },
    loading: false,
    error: null
  },
  reducers: {
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    appendNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      
      // Mark As Read
      .addCase(markAsReadAsync.fulfilled, (state, action) => {
        const ids = action.payload;
        state.notifications = state.notifications.map(n =>
          ids.includes(n._id) ? { ...n, readStatus: true, seenStatus: true } : n
        );
      })
      
      // Mark All As Read
      .addCase(markAllAsReadAsync.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({
          ...n,
          readStatus: true,
          seenStatus: true
        }));
        state.unreadCount = 0;
      })
      
      // Delete Notification
      .addCase(deleteNotificationAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.notifications = state.notifications.filter(n => n._id !== id);
      })
      
      // Delete All
      .addCase(deleteAllNotificationsAsync.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      })
      
      // Fetch Settings
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      })
      
      // Update Settings
      .addCase(updateSettingsAsync.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  }
});

export const {
  incrementUnreadCount,
  decrementUnreadCount,
  setUnreadCount,
  appendNotification
} = notificationSlice.actions;

export default notificationSlice.reducer;
