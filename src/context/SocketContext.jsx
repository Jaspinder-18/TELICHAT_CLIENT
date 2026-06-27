import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  addMessage,
  updateUserOnlineStatus,
  setTypingIndicator,
  updateMessageState,
  deleteMessageState,
  updateGroup
} from '../redux/chatSlice.js';
import { setAlert } from '../redux/uiSlice.js';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to WebSocket server
      let defaultSocketUrl = window.location.origin;
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'telichat-client.onrender.com') {
          defaultSocketUrl = 'https://telichat-server.onrender.com';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          defaultSocketUrl = 'http://localhost:5000';
        }
      }
      const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to chat server socket');
        socket.emit('user-online', user.id);
      });

      // Listen for other users status changes
      socket.on('user-status-change', (data) => {
        dispatch(updateUserOnlineStatus(data));
      });

      // Listen for incoming messages
      socket.on('receive-message', (message) => {
        dispatch(addMessage(message));
        
        // Trigger browser notification if allowed and tab is backgrounded
        if (
          Notification.permission === 'granted' && 
          message.sender._id !== user.id
        ) {
          new Notification(message.sender.firstName || `@${message.sender.username}`, {
            body: message.type === 'file' ? 'Sent a file' : message.content,
            icon: message.sender.profilePhoto || '/default-avatar.png'
          });
        }
      });

      // Listen for message edits/deletes
      socket.on('message-edited', (message) => {
        dispatch(updateMessageState(message));
      });

      socket.on('message-deleted', (data) => {
        dispatch(deleteMessageState(data));
      });

      // Listen for typing events
      socket.on('typing', ({ senderId, recipientId, recipientType }) => {
        const roomKey = recipientType === 'user' ? senderId : recipientId;
        dispatch(setTypingIndicator({ chatRoomId: roomKey, userId: senderId, isTyping: true }));
      });

      socket.on('stop-typing', ({ senderId, recipientId, recipientType }) => {
        const roomKey = recipientType === 'user' ? senderId : recipientId;
        dispatch(setTypingIndicator({ chatRoomId: roomKey, userId: senderId, isTyping: false }));
      });

      // Group update event (e.g. member joins or settings changes)
      socket.on('group-updated', (group) => {
        dispatch(updateGroup(group));
      });

      socket.on('user-joined-group', ({ group, userName }) => {
        dispatch(updateGroup(group));
        dispatch(setAlert({ message: `${userName} joined the group`, severity: 'info' }));
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [isAuthenticated, user, dispatch]);

  const emitTyping = (recipientId, recipientType, isTyping) => {
    if (socketRef.current && user) {
      const event = isTyping ? 'typing' : 'stop-typing';
      socketRef.current.emit(event, {
        senderId: user.id,
        recipientId,
        recipientType
      });
    }
  };

  const joinRoom = (roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
    }
  };

  const value = {
    socket: socketRef.current,
    emitTyping,
    joinRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
