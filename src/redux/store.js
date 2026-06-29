import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import chatReducer from './chatSlice.js';
import botReducer from './botSlice.js';
import uiReducer from './uiSlice.js';
import notificationReducer from './notificationSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    bot: botReducer,
    ui: uiReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Let socket instances or date values pass through cleanly
    }),
});
export default store;
