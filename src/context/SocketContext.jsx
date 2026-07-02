import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  addMessage,
  updateUserOnlineStatus,
  setTypingIndicator,
  updateMessageState,
  markAllActiveMessagesSeen,
  deleteMessageState,
  updateGroup,
  addGroup,
  addChannel
} from '../redux/chatSlice.js';
import { setAlert, setInAppNotification } from '../redux/uiSlice.js';
import { store } from '../redux/store.js';
import {
  setUnreadCount,
  incrementUnreadCount,
  appendNotification
} from '../redux/notificationSlice.js';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { activeChat, activeChatType } = useSelector((state) => state.chat);

  useEffect(() => {
    if (socketRef.current && activeChat && activeChatType === 'user') {
      socketRef.current.emit('mark-all-seen', { chatPartnerId: activeChat._id });
    }
  }, [activeChat, activeChatType]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to WebSocket server
      let defaultSocketUrl = 'https://telichat-server.onrender.com';
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          defaultSocketUrl = 'http://localhost:5000';
        }
      }
      const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      const announceOnline = () => {
        if (socket.connected) {
          console.log('Announcing online status...');
          socket.emit('user-online', user?.id || user?._id);
        }
      };

      socket.on('connect', () => {
        console.log('Connected to chat server socket');
        announceOnline();
      });

      // Announce immediately if already connected (e.g. context reloaded but socket kept alive)
      announceOnline();

      // Listen for other users status changes
      socket.on('user-status-change', (data) => {
        dispatch(updateUserOnlineStatus(data));
      });

      // Listen for incoming messages
      socket.on('receive-message', (message) => {
        dispatch(addMessage(message));
        
        const chatState = store.getState().chat;
        const currentActiveChat = chatState.activeChat;
        const currentActiveChatType = chatState.activeChatType;

        const isFromActiveChat = currentActiveChat && (
          (currentActiveChatType === 'user' && message.sender._id === currentActiveChat._id) ||
          (currentActiveChatType === 'group' && message.recipientGroup === currentActiveChat._id) ||
          (currentActiveChatType === 'channel' && message.recipientChannel === currentActiveChat._id)
        );

        if (message.sender._id !== (user?.id || user?._id)) {
          if (isFromActiveChat && socket) {
            socket.emit('mark-as-seen', { messageId: message._id, senderId: message.sender._id });
          }
          const notifyTitle = message.sender.firstName || `@${message.sender.username}`;
          const notifyBody = message.type === 'file' ? '📁 Sent a file' : message.content;

          // 1. Android APK JS bridge notification (shows on lockscreen and top banner)
          if (window.NotificationChannel && (document.hidden || !isFromActiveChat)) {
            try {
              window.NotificationChannel.postMessage(JSON.stringify({
                title: notifyTitle,
                body: notifyBody
              }));
            } catch (e) {
              console.error('Failed to post message to NotificationChannel:', e);
            }
          }

          // 2. Windows Desktop WebView2 JS bridge notification
          if (window.chrome?.webview && (document.hidden || !isFromActiveChat)) {
            try {
              window.chrome.webview.postMessage(JSON.stringify({
                type: 'notification',
                title: notifyTitle,
                body: notifyBody
              }));
            } catch (e) {
              console.error('Failed to post message to WebView2:', e);
            }
          }

          // 3. Standard HTML5 web notifications / WebView2 native events
          if (Notification.permission === 'granted' && (document.hidden || !isFromActiveChat)) {
            new Notification(notifyTitle, {
              body: notifyBody,
              icon: message.sender.profilePhoto || '/default-avatar.png'
            });
          }

          // Trigger Telegram-style in-app notification if not actively chatting in this room
          if (!isFromActiveChat) {
            dispatch(setInAppNotification({
              title: message.sender.firstName || `@${message.sender.username}`,
              content: message.type === 'file' ? '📂 Sent a file' : message.content,
              avatar: message.sender.profilePhoto,
              chat: message.recipientGroup 
                ? { chat: { _id: message.recipientGroup, name: message.groupName || 'Group' }, type: 'group' }
                : message.recipientChannel
                ? { chat: { _id: message.recipientChannel, name: message.channelName || 'Channel' }, type: 'channel' }
                : { chat: message.sender, type: 'user' }
            }));
          }
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

      socket.on('message-seen', ({ messageId, status }) => {
        dispatch(updateMessageState({ _id: messageId, status }));
      });

      socket.on('all-messages-seen', ({ viewerId }) => {
        dispatch(markAllActiveMessagesSeen({ viewerId }));
      });

      // Group update event (e.g. member joins or settings changes)
      socket.on('group-updated', (group) => {
        dispatch(updateGroup(group));
      });

      socket.on('user-joined-group', ({ group, userName }) => {
        dispatch(updateGroup(group));
        dispatch(setAlert({ message: `${userName} joined the group`, severity: 'info' }));
      });

      // Real-time additions
      socket.on('group-created', (group) => {
        dispatch(addGroup(group));
        if (socketRef.current) {
          socketRef.current.emit('join-room', group._id);
        }
        dispatch(setAlert({ message: `You were added to group: ${group.name}`, severity: 'success' }));
      });

      socket.on('channel-created', (channel) => {
        dispatch(addChannel(channel));
        if (socketRef.current) {
          socketRef.current.emit('join-room', channel._id);
        }
        dispatch(setAlert({ message: `You subscribed to channel: ${channel.name}`, severity: 'success' }));
      });

      // Real-time Notification Sync
      socket.on('notifications-sync', ({ unreadCount }) => {
        dispatch(setUnreadCount(unreadCount));
      });

      // Handle new incoming notifications
      socket.on('new-notification', (payload) => {
        dispatch(appendNotification(payload));
        dispatch(incrementUnreadCount());

        // Play alert sound based on user settings
        try {
          const soundName = payload.sound || 'default.mp3';
          const playSynthBeep = () => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            if (soundName.includes('call')) {
              osc.frequency.setValueAtTime(600, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.35);
            } else if (soundName.includes('mention')) {
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.08, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.18);
            } else {
              osc.frequency.setValueAtTime(440, ctx.currentTime);
              gain.gain.setValueAtTime(0.05, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.12);
            }
          };

          const audio = new Audio(`/sounds/${soundName}`);
          audio.play().catch(() => playSynthBeep());
        } catch (e) {
          console.log('Audio alert error:', e);
        }

        // Native notification popup
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          new Notification(payload.title, {
            body: payload.body,
            icon: '/favicon.ico'
          });
        }
      });

      // Register Web Push subscription registry
      const registerWebPush = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const res = await api.get('/notifications/vapid-public-key');
            const publicKey = res.data.publicKey;

            const urlBase64ToUint8Array = (base64String) => {
              const padding = '='.repeat((4 - base64String.length % 4) % 4);
              const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
              const rawData = window.atob(base64);
              const outputArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              return outputArray;
            };

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            await api.post('/notifications/subscribe', { subscription });
          } catch (err) {
            console.warn('[Web Push] Subscription failed:', err.message);
          }
        }
      };
      
      // Request notifications permission and subscribe
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') registerWebPush();
          });
        } else if (Notification.permission === 'granted') {
          registerWebPush();
        }
      }

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [isAuthenticated, user, dispatch]);

  const emitTyping = ({ recipientId, recipientType = 'user', isTyping }) => {
    if (socketRef.current && user) {
      const event = isTyping ? 'typing' : 'stop-typing';
      socketRef.current.emit(event, {
        senderId: user?.id || user?._id,
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
