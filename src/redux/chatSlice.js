import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  contacts: [],
  messages: [], // Message list for selected chat
  activeChat: null, // Selected User, Group, or Channel object
  activeChatType: null, // 'user' | 'group' | 'channel'
  myGroups: [],
  myChannels: [],
  starredMessages: [],
  sharedFiles: [],
  onlineUsers: {}, // Map of userId: true/false
  typingUsers: {}, // Map of chatRoomId: [userIds...]
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload;
      action.payload.forEach(c => {
        state.onlineUsers[c._id] = c.isOnline;
      });
    },
    setMyGroups: (state, action) => {
      state.myGroups = action.payload;
    },
    addGroup: (state, action) => {
      state.myGroups.unshift(action.payload);
    },
    updateGroup: (state, action) => {
      const idx = state.myGroups.findIndex(g => g._id === action.payload._id);
      if (idx > -1) {
        state.myGroups[idx] = action.payload;
      }
      if (state.activeChat && state.activeChat._id === action.payload._id) {
        state.activeChat = action.payload;
      }
    },
    setMyChannels: (state, action) => {
      state.myChannels = action.payload;
    },
    addChannel: (state, action) => {
      state.myChannels.unshift(action.payload);
    },
    updateChannel: (state, action) => {
      const idx = state.myChannels.findIndex(c => c._id === action.payload._id);
      if (idx > -1) {
        state.myChannels[idx] = action.payload;
      }
      if (state.activeChat && state.activeChat._id === action.payload._id) {
        state.activeChat = action.payload;
      }
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload.chat;
      state.activeChatType = action.payload.type;
      state.messages = []; // Clear messages, will load via API
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      // Add message if it belongs to currently active chat viewport
      const matchesUser = state.activeChatType === 'user' && 
        ((msg.sender._id === state.activeChat._id && msg.recipientUser === msg.recipientUser) || 
         (msg.sender._id === msg.sender._id && msg.recipientUser === state.activeChat._id));
         
      const matchesGroup = state.activeChatType === 'group' && msg.recipientGroup === state.activeChat._id;
      const matchesChannel = state.activeChatType === 'channel' && msg.recipientChannel === state.activeChat._id;

      if (matchesUser || matchesGroup || matchesChannel) {
        // Prevent duplicate loads
        if (state.messages.some(m => m._id === msg._id)) {
          return;
        }

        // Optimistic UI matching: If this message is sent by the current user
        // and we have a temporary message in the list, replace it!
        const tempIdx = state.messages.findIndex(m => m.isTemp && m.content === msg.content);
        if (tempIdx > -1) {
          state.messages[tempIdx] = msg;
        } else {
          state.messages.push(msg);
        }
      }
    },
    updateMessageState: (state, action) => {
      const idx = state.messages.findIndex(m => m._id === action.payload._id);
      if (idx > -1) {
        if (action.payload.replaceWith) {
          state.messages[idx] = action.payload.replaceWith;
        } else {
          state.messages[idx] = { ...state.messages[idx], ...action.payload };
        }
      }
    },
    deleteMessageState: (state, action) => {
      state.messages = state.messages.filter(m => m._id !== action.payload.messageId);
    },
    setStarredMessages: (state, action) => {
      state.starredMessages = action.payload;
    },
    setSharedFiles: (state, action) => {
      state.sharedFiles = action.payload;
    },
    addSharedFile: (state, action) => {
      state.sharedFiles.unshift(action.payload);
    },
    updateUserOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.onlineUsers[userId] = isOnline;
      
      // Also update contacts list online state
      const contactIdx = state.contacts.findIndex(c => c._id === userId);
      if (contactIdx > -1) {
        state.contacts[contactIdx].isOnline = isOnline;
        if (!isOnline) {
          state.contacts[contactIdx].lastSeen = new Date();
        }
      }
    },
    setOnlineUsersMap: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setTypingIndicator: (state, action) => {
      const { chatRoomId, userId, isTyping } = action.payload;
      if (!state.typingUsers[chatRoomId]) {
        state.typingUsers[chatRoomId] = [];
      }
      if (isTyping) {
        if (!state.typingUsers[chatRoomId].includes(userId)) {
          state.typingUsers[chatRoomId].push(userId);
        }
      } else {
        state.typingUsers[chatRoomId] = state.typingUsers[chatRoomId].filter(id => id !== userId);
      }
    }
  }
});

export const {
  setContacts,
  setMyGroups,
  addGroup,
  updateGroup,
  setMyChannels,
  addChannel,
  updateChannel,
  setActiveChat,
  setMessages,
  addMessage,
  updateMessageState,
  deleteMessageState,
  setStarredMessages,
  setSharedFiles,
  addSharedFile,
  updateUserOnlineStatus,
  setOnlineUsersMap,
  setTypingIndicator
} = chatSlice.actions;

export default chatSlice.reducer;
