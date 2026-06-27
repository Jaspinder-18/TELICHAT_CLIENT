import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: localStorage.getItem('theme') || 'dark', // Default dark
  rightSidebarOpen: false,
  leftSidebarTab: 'chats', // 'chats' | 'groups' | 'channels' | 'bots' | 'contacts' | 'files' | 'saved' | 'settings'
  alert: null, // { message: string, severity: 'success'|'error'|'info'|'warning' }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = nextTheme;
      localStorage.setItem('theme', nextTheme);
      
      // Update DOM class lists
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setRightSidebarOpen: (state, action) => {
      state.rightSidebarOpen = action.payload;
    },
    setLeftSidebarTab: (state, action) => {
      state.leftSidebarTab = action.payload;
    },
    setAlert: (state, action) => {
      state.alert = action.payload; // { message, severity }
    },
    clearAlert: (state) => {
      state.alert = null;
    }
  }
});

export const {
  toggleTheme,
  setTheme,
  setRightSidebarOpen,
  setLeftSidebarTab,
  setAlert,
  clearAlert
} = uiSlice.actions;

export default uiSlice.reducer;
