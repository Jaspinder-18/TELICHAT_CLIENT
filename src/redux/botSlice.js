import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myBots: [],
  selectedBotLogs: [],
  selectedBotStats: null,
  loading: false,
};

const botSlice = createSlice({
  name: 'bot',
  initialState,
  reducers: {
    setMyBots: (state, action) => {
      state.myBots = action.payload;
    },
    addBot: (state, action) => {
      state.myBots.unshift(action.payload);
    },
    removeBotState: (state, action) => {
      state.myBots = state.myBots.filter(b => b._id !== action.payload);
    },
    updateBotTokenState: (state, action) => {
      const idx = state.myBots.findIndex(b => b._id === action.payload.id);
      if (idx > -1) {
        state.myBots[idx].token = action.payload.token;
      }
    },
    setBotStats: (state, action) => {
      state.selectedBotStats = action.payload;
    }
  }
});

export const {
  setMyBots,
  addBot,
  removeBotState,
  updateBotTokenState,
  setBotStats
} = botSlice.actions;

export default botSlice.reducer;
