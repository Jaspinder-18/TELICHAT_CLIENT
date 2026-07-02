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
      if (action.payload.chat) {
        const chatId = action.payload.chat._id;
        if (action.payload.type === 'user') {
          const idx = state.contacts.findIndex(c => c._id === chatId);
          if (idx > -1) state.contacts[idx].unreadCount = 0;
        } else if (action.payload.type === 'group') {
          const idx = state.myGroups.findIndex(g => g._id === chatId);
          if (idx > -1) state.myGroups[idx].unreadCount = 0;
        } else if (action.payload.type === 'channel') {
          const idx = state.myChannels.findIndex(c => c._id === chatId);
          if (idx > -1) state.myChannels[idx].unreadCount = 0;
        }
      }
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      
      // Update unread count for sidebar if this is not the active chat viewport
      const isFromActiveChat = state.activeChat && (
        (state.activeChatType === 'user' && (msg.sender?._id || msg.sender) === state.activeChat._id) ||
        (state.activeChatType === 'group' && msg.recipientGroup === state.activeChat._id) ||
        (state.activeChatType === 'channel' && msg.recipientChannel === state.activeChat._id)
      );

      if (!isFromActiveChat) {
        const senderId = msg.sender?._id || msg.sender;
        if (msg.recipientType === 'user') {
          const idx = state.contacts.findIndex(c => c._id === senderId);
          if (idx > -1) state.contacts[idx].unreadCount = (state.contacts[idx].unreadCount || 0) + 1;
        } else if (msg.recipientType === 'group') {
          const idx = state.myGroups.findIndex(g => g._id === msg.recipientGroup);
          if (idx > -1) state.myGroups[idx].unreadCount = (state.myGroups[idx].unreadCount || 0) + 1;
        } else if (msg.recipientType === 'channel') {
          const idx = state.myChannels.findIndex(c => c._id === msg.recipientChannel);
          if (idx > -1) state.myChannels[idx].unreadCount = (state.myChannels[idx].unreadCount || 0) + 1;
        }
      }

      // Add message if it belongs to currently active chat viewport
      const activeChatId = state.activeChat?._id;
      const senderId = msg.sender?._id || msg.sender;
      const matchesUser = state.activeChatType === 'user' && 
        ((senderId === activeChatId && msg.recipientUser === msg.recipientUser) || 
         (senderId === senderId && msg.recipientUser === activeChatId));
         
      const matchesGroup = state.activeChatType === 'group' && msg.recipientGroup === activeChatId;
      const matchesChannel = state.activeChatType === 'channel' && msg.recipientChannel === activeChatId;

      if (matchesUser || matchesGroup || matchesChannel) {
        if (state.messages.some(m => m._id === msg._id)) {
          return;
        }

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
    markAllActiveMessagesSeen: (state, action) => {
      const { viewerId } = action.payload;
      state.messages = state.messages.map(m => {
        const senderId = m.sender?._id || m.sender;
        if (senderId && senderId !== viewerId) {
          return { ...m, status: 'seen' };
        }
        return m;
      });
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

      // Keep active chat header in sync
      if (state.activeChat && state.activeChatType === 'user' && state.activeChat._id === userId) {
        state.activeChat = { ...state.activeChat, isOnline };
      }

      // Keep group members in sync
      if (state.activeChat && state.activeChatType === 'group' && state.activeChat.members) {
        const updatedMembers = state.activeChat.members.map(m => {
          if (m.user && (m.user._id === userId || m.user === userId)) {
            return {
              ...m,
              user: typeof m.user === 'object' ? { ...m.user, isOnline } : m.user
            };
          }
          return m;
        });
        state.activeChat = { ...state.activeChat, members: updatedMembers };
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
  markAllActiveMessagesSeen,
  deleteMessageState,
  setStarredMessages,
  setSharedFiles,
  addSharedFile,
  updateUserOnlineStatus,
  setOnlineUsersMap,
  setTypingIndicator
} = chatSlice.actions;

export default chatSlice.reducer;
