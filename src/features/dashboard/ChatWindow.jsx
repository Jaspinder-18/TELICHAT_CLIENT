import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setRightSidebarOpen, setAlert } from '../../redux/uiSlice.js';
import { setMessages as setChatMessages, addMessage as addChatMessage, updateMessageState as updateChatMessage, deleteMessageState, setActiveChat } from '../../redux/chatSlice.js';
import api, { getFileUrl } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';

// MUI Icons
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ForwardIcon from '@mui/icons-material/Forward';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import PushPinIcon from '@mui/icons-material/PushPin';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

export const ChatWindow = () => {
  const dispatch = useDispatch();
  const { emitTyping } = useSocket();

  const { activeChat, activeChatType, messages, typingUsers, contacts } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const { rightSidebarOpen } = useSelector((state) => state.ui);

  const [inputContent, setInputContent] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [forwardMsgObj, setForwardMsgObj] = useState(null);
  
  // File uploading states
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Poll creation state
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Scheduled message state
  const [scheduledDate, setScheduledDate] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);

  const [downloadProgress, setDownloadProgress] = useState({});
  const [activeMenuMsg, setActiveMenuMsg] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleDownloadFile = async (fileId, originalName) => {
    if (downloadProgress[fileId] !== undefined) return;
    setDownloadProgress(prev => ({ ...prev, [fileId]: 0 }));
    try {
      const res = await api.get(`/file/download/${fileId}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(prev => ({ ...prev, [fileId]: percent }));
          }
        }
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || 'downloaded-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      dispatch(setAlert({ message: 'Failed to download file', severity: 'error' }));
    } finally {
      setDownloadProgress(prev => {
        const copy = { ...prev };
        delete copy[fileId];
        return copy;
      });
    }
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    let x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : screenWidth / 2);
    let y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : screenHeight / 2);
    if (x + 200 > screenWidth) {
      x = screenWidth - 210;
    }
    if (y + 260 > screenHeight) {
      y = screenHeight - 270;
    }
    setActiveMenuMsg(msg);
    setMenuCoords({ x, y });
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuMsg(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch message history when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        let res;
        if (activeChatType === 'user') {
          res = await api.get(`/chat/history/${activeChat._id}`);
        } else if (activeChatType === 'group') {
          res = await api.get(`/group/${activeChat._id}/messages`);
        } else if (activeChatType === 'channel') {
          res = await api.get(`/channel/${activeChat._id}/posts`);
        }
        dispatch(setChatMessages(res.data));
      } catch (err) {
        console.error('Failed to load chat history', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
    // Reset states
    setReplyMessage(null);
    setEditMessage(null);
    setInputContent('');
  }, [activeChat, activeChatType, dispatch]);

  // Scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollBtn(true);
    } else {
      setShowScrollBtn(false);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Typing emitter handling
  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    
    if (activeChatType === 'user') {
      if (!isTypingLocal) {
        setIsTypingLocal(true);
        emitTyping({ recipientId: activeChat._id, isTyping: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        emitTyping({ recipientId: activeChat._id, isTyping: false });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    setIsSendingMessage(true);
    const tempId = `temp-${Date.now()}`;
    const payload = {
      recipientId: activeChat._id,
      recipientType: activeChatType,
      content: inputContent,
      replyToId: replyMessage?._id || undefined,
    };

    let tempScheduledDate = null;
    if (showScheduler && scheduledDate) {
      tempScheduledDate = scheduledDate;
      payload.scheduledAt = scheduledDate;
      setShowScheduler(false);
      setScheduledDate('');
    }

    // Optimistic UI updates
    if (!tempScheduledDate) {
      const optimisticMsg = {
        _id: tempId,
        sender: { _id: user.id, username: user.username },
        content: inputContent,
        createdAt: new Date().toISOString(),
        status: 'sending',
        isTemp: true,
        replyTo: replyMessage ? { content: replyMessage.content } : undefined,
        type: 'text',
      };
      dispatch(addChatMessage(optimisticMsg));
    }

    setInputContent('');
    setReplyMessage(null);

    try {
      let res;
      if (editMessage) {
        res = await api.put(`/chat/message/${editMessage._id}`, { content: payload.content });
        dispatch(updateChatMessage(res.data));
        setEditMessage(null);
        dispatch(setAlert({ message: 'Message updated', severity: 'success' }));
      } else {
        if (activeChatType === 'channel') {
          res = await api.post(`/channel/${activeChat._id}/post`, payload);
        } else {
          res = await api.post('/chat/message', payload);
        }
        
        if (tempScheduledDate) {
          dispatch(setAlert({ message: 'Message scheduled successfully!', severity: 'success' }));
          return;
        }

        dispatch(updateChatMessage({ _id: tempId, replaceWith: res.data }));
      }
    } catch (err) {
      console.error(err);
      if (!tempScheduledDate) {
        dispatch(updateChatMessage({ _id: tempId, status: 'failed' }));
      }
      dispatch(setAlert({ message: 'Failed to send message', severity: 'error' }));
    } finally {
      setIsSendingMessage(false);
    }
  };

  // React to message
  const handleReact = async (msgId, emoji) => {
    try {
      const res = await api.post(`/chat/message/${msgId}/reaction`, { emoji });
      dispatch(updateChatMessage(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  // Star message
  const handleStar = async (msgId) => {
    try {
      await api.post(`/chat/message/${msgId}/star`);
      dispatch(setAlert({ message: 'Starred state updated', severity: 'info' }));
    } catch (err) {
      console.error(err);
    }
  };

  // Pin message
  const handlePin = async (msgId) => {
    try {
      await api.post(`/chat/message/${msgId}/pin`);
      dispatch(setAlert({ message: 'Pinned state updated', severity: 'success' }));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message
  const handleDelete = async (msgId) => {
    try {
      await api.delete(`/chat/message/${msgId}`);
      dispatch(deleteMessageState({ messageId: msgId }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(15);
    const data = new FormData();
    data.append('file', file);

    try {
      setUploadProgress(40);
      const res = await api.post('/file/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadProgress(80);

      const msgPayload = {
        recipientId: activeChat._id,
        recipientType: activeChatType,
        content: `Uploaded file: ${file.name}`,
        type: 'file',
        fileId: res.data._id
      };

      let msgRes;
      if (activeChatType === 'channel') {
        msgRes = await api.post(`/channel/${activeChat._id}/post`, msgPayload);
      } else {
        msgRes = await api.post('/chat/message', msgPayload);
      }
      
      dispatch(addChatMessage(msgRes.data));
      setUploadProgress(100);
      dispatch(setAlert({ message: 'File uploaded successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'File upload failed', severity: 'error' }));
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const addPollOptionField = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handlePollOptionChange = (idx, val) => {
    const list = [...pollOptions];
    list[idx] = val;
    setPollOptions(list);
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/group/${activeChat._id}/poll`, {
        question: pollQuestion,
        options: pollOptions.filter(Boolean),
        recipientType: activeChatType
      });
      dispatch(addChatMessage(res.data));
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (msgId, optIdx) => {
    try {
      const res = await api.post(`/group/poll/vote`, { messageId: msgId, optionIndex: optIdx });
      dispatch(updateChatMessage(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const chatRoomId = activeChat?._id;
  const currentTypingUsers = typingUsers[chatRoomId] || [];

  const getTypingText = () => {
    if (currentTypingUsers.length === 0) return '';
    if (activeChatType === 'user') return 'typing...';
    
    const names = currentTypingUsers.map(id => {
      const member = activeChat.members?.find(m => (m.user?._id || m.user) === id);
      if (member && member.user) {
        return member.user.firstName || `@${member.user.username}`;
      }
      const contact = contacts?.find(c => c._id === id);
      if (contact) {
        return contact.firstName || `@${contact.username}`;
      }
      return 'Someone';
    });
    
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return 'Multiple people are typing...';
  };

  if (!activeChat) {
    return (
      <div className="flex-grow h-full flex flex-col items-center justify-center bg-tg-bgChatDark tg-chat-bg text-tg-textMuted select-none relative p-4">
        {/* Decorative gradient spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-tg-blue/10 blur-[90px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-tg-bgSidebarDark/60 backdrop-blur-xl border border-tg-borderDark/60 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-sm text-center space-y-4 relative z-10"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-tg-blue/10 to-tg-blue/20 rounded-2xl flex items-center justify-center text-tg-blue mx-auto border border-tg-blue/20 shadow-md">
            <InfoOutlinedIcon fontSize="medium" />
          </div>
          <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Welcome to TeliChat</h3>
          <p className="text-xs text-tg-textMuted leading-relaxed">
            Select a conversation, group room, or corporate channel from the sidebar list to start chatting.
          </p>
        </motion.div>
      </div>
    );
  }

  const pinnedMessage = messages.find(m => m.isPinned);

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`flex-grow h-full flex flex-col bg-tg-bgChatDark tg-chat-bg relative ${dragActive ? 'brightness-90' : ''}`}
    >
      {/* Drag upload overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-tg-bgDark/80 backdrop-blur-md z-40 flex items-center justify-center pointer-events-none border-2 border-dashed border-tg-blue/40 m-4 rounded-3xl"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-tg-blue/10 border border-tg-blue/20 flex items-center justify-center text-tg-blue mx-auto animate-bounce">
                <AttachFileIcon fontSize="medium" />
              </div>
              <h4 className="text-xs font-bold text-tg-textDefault uppercase tracking-wider">Drop files to send</h4>
              <p className="text-[10px] text-tg-textMuted mt-1 leading-normal">Supports images, docs, media up to 50MB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat header */}
      <div className="h-[60px] bg-tg-bgSidebarDark border-b border-tg-borderDark flex items-center justify-between px-4 md:px-6 z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(setActiveChat({ chat: null, type: null }))}
            className="p-1.5 rounded-xl hover:bg-tg-bgDark text-tg-textMuted hover:text-tg-textDefault transition md:hidden"
          >
            <ArrowBackIcon fontSize="small" />
          </button>
          
          <div className="text-left">
            <h3 className="text-xs font-bold text-tg-textDefault">
              {activeChatType === 'user'
                ? (activeChat.firstName || activeChat.lastName ? `${activeChat.firstName || ''} ${activeChat.lastName || ''}`.trim() : `@${activeChat.username}`)
                : activeChat.name}
            </h3>
            {currentTypingUsers.length > 0 ? (
              <span className="text-[9px] text-green-500 font-bold block mt-0.5 animate-pulse">
                {getTypingText()}
              </span>
            ) : (
              <span className="text-[9px] text-tg-textMuted font-medium block mt-0.5">
                {activeChatType === 'user' ? (activeChat.isOnline ? 'Online' : 'Offline') : activeChatType === 'group' ? `${activeChat.members?.length || 0} members • Group` : `${activeChat.subscribers?.length || 0} subscribers • Channel`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(setRightSidebarOpen(!rightSidebarOpen))}
            className={`p-2 rounded-xl transition ${rightSidebarOpen ? 'bg-tg-blue/10 text-tg-blue border border-tg-blue/20' : 'text-tg-textMuted hover:bg-tg-bgDark'}`}
            title="Conversation details"
          >
            <InfoOutlinedIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Pinned Message Banner */}
      <AnimatePresence>
        {pinnedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-tg-bgSidebarDark/90 backdrop-blur-md border-b border-tg-borderDark/80 px-5 py-2.5 flex items-center justify-between z-20 text-left shadow-sm relative flex-shrink-0"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <PushPinIcon fontSize="small" className="text-tg-blue" style={{ fontSize: '14px' }} />
              <div className="overflow-hidden">
                <span className="text-[9px] font-bold uppercase tracking-wider text-tg-blue block">Pinned Message</span>
                <p className="text-xs text-tg-textMuted truncate leading-relaxed">{pinnedMessage.content}</p>
              </div>
            </div>
            <button
              onClick={() => handlePin(pinnedMessage._id)} // Toggle pin state off
              className="p-1 rounded-xl text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition ml-4"
              title="Unpin message"
            >
              <CloseIcon fontSize="inherit" style={{ fontSize: '13px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message List Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto px-4 md:px-6 py-6 space-y-4 relative flex flex-col"
      >
        {loadingHistory ? (
          // History Skeletons
          <div className="space-y-4 my-auto w-full">
            {[1, 2, 3].map(idx => {
              const selfSide = idx % 2 === 0;
              return (
                <div key={idx} className={`flex flex-col max-w-[60%] ${selfSide ? 'ml-auto items-end' : 'mr-auto items-start'} space-y-1`}>
                  <div className="h-2.5 w-16 bg-tg-borderDark/60 skeleton rounded mb-1" />
                  <div className={`h-12 w-48 bg-tg-borderDark/60 skeleton rounded-2xl ${selfSide ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                </div>
              );
            })}
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender._id === user.id;
            return (
              <div
                key={msg._id}
                className={`flex flex-col max-w-[85%] md:max-w-[70%] group relative ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start animate-slide-in'}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                {/* Message Metadata Sender Header */}
                {!isSelf && (
                  <span className="text-[9px] font-bold text-tg-textMuted mb-1 ml-2">
                    {msg.sender.firstName || msg.sender.lastName ? `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() : `@${msg.sender.username}`}
                  </span>
                )}

                {/* Message Bubble container */}
                <div
                  className={`p-3 rounded-2xl relative shadow-md ${
                    isSelf 
                      ? 'bg-tg-bubbleSelfDark text-white rounded-tr-none border border-tg-blue/15 shadow-tg-blue/5' 
                      : 'bg-tg-bubbleOtherDark text-tg-textDefault rounded-tl-none border border-tg-borderDark/60'
                  } ${msg.status === 'sending' ? 'animate-pulse opacity-75 border-dashed border-tg-blue/40' : ''}`}
                >
                  {/* Chevron trigger dropdown */}
                  {!msg.isTemp && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveMenuMsg(msg);
                        setMenuCoords({ x: rect.left, y: rect.bottom + 5 });
                      }}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded text-tg-textMuted bg-black/10 hover:bg-black/20 hover:text-tg-textDefault opacity-0 group-hover:opacity-100 transition z-10"
                      title="Options"
                    >
                      <MoreVertIcon fontSize="inherit" style={{ fontSize: '12px' }} />
                    </button>
                  )}
                  
                  {/* Reply display reference */}
                  {msg.replyTo && (
                    <div className="bg-black/10 border-l-2 border-tg-blue p-1.5 rounded mb-2 text-left cursor-pointer opacity-85">
                      <span className="text-[9px] font-bold text-tg-blue block">Reply to</span>
                      <p className="text-[10px] truncate text-tg-textMuted">{msg.replyTo.content}</p>
                    </div>
                  )}

                  {/* Forwarded Tag */}
                  {msg.forwardFrom && (
                    <span className="text-[9px] italic text-tg-textMuted block mb-1.5">
                      Forwarded from {msg.forwardFrom.firstName}
                    </span>
                  )}

                  {/* File attachments rendering */}
                  {msg.type === 'file' && msg.file && (
                    <div className="mb-2">
                      {msg.file.mimeType?.startsWith('image/') ? (
                        <div className="relative rounded-xl overflow-hidden border border-tg-borderDark max-w-sm max-h-[250px] bg-black/15 group/img">
                          <img
                            src={getFileUrl(msg.file.path)}
                            alt={msg.file.originalname}
                            className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition"
                            onClick={() => window.open(getFileUrl(msg.file.path), '_blank')}
                          />
                          {downloadProgress[msg.file._id] !== undefined ? (
                            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-white z-10">
                              <div className="w-8 h-8 border-3 border-tg-blue border-t-transparent rounded-full animate-spin mb-1.5" />
                              <span className="text-[10px] font-semibold">{downloadProgress[msg.file._id]}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownloadFile(msg.file._id, msg.file.originalname);
                              }}
                              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition opacity-0 group-hover/img:opacity-100 shadow-md z-10"
                              title="Download Image"
                            >
                              <DownloadIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      ) : msg.file.mimeType?.startsWith('video/') ? (
                        <div className="relative rounded-xl overflow-hidden border border-tg-borderDark max-w-sm bg-black/15">
                          <video
                            src={getFileUrl(msg.file.path)}
                            controls
                            className="w-full max-h-[250px] object-contain focus:outline-none"
                          />
                          {downloadProgress[msg.file._id] !== undefined ? (
                            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-white z-10">
                              <div className="w-8 h-8 border-3 border-tg-blue border-t-transparent rounded-full animate-spin mb-1.5" />
                              <span className="text-[10px] font-semibold">{downloadProgress[msg.file._id]}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownloadFile(msg.file._id, msg.file.originalname);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition shadow-md z-10"
                              title="Download Video"
                            >
                              <DownloadIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-black/10 p-2.5 rounded-xl border border-tg-borderDark">
                          <FilePresentIcon className="text-tg-blue" />
                          <div className="text-left overflow-hidden">
                            <p className="text-xs font-semibold truncate text-tg-textDefault">{msg.file.originalname}</p>
                            <span className="text-[10px] text-tg-textMuted">
                              {(msg.file.size / 1024 / 1024).toFixed(2)} MB • v{msg.file.version}
                            </span>
                          </div>
                          {downloadProgress[msg.file._id] !== undefined ? (
                            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                              <div className="w-4 h-4 border-2 border-tg-blue border-t-transparent rounded-full animate-spin" />
                              <span className="text-[9px] font-bold text-tg-blue">{downloadProgress[msg.file._id]}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownloadFile(msg.file._id, msg.file.originalname);
                              }}
                              className="p-1.5 rounded-full bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition ml-auto flex-shrink-0"
                              title="Download file"
                            >
                              <DownloadIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Poll display block */}
                  {msg.type === 'poll' && msg.poll && (
                    <div className="bg-black/10 p-3 rounded-xl border border-tg-borderDark space-y-3 text-left w-64">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-tg-textDefault">
                        <InsertChartOutlinedIcon className="text-tg-blue" fontSize="small" />
                        <span>{msg.poll.question}</span>
                      </div>
                      <div className="space-y-2">
                        {msg.poll.options.map((opt, oIdx) => {
                          const totalVotes = msg.poll.options.reduce((sum, o) => sum + o.votes.length, 0);
                          const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                          const hasVoted = opt.votes.includes(user.id);

                          return (
                            <div
                              key={opt._id || oIdx}
                              onClick={() => handleVote(msg._id, oIdx)}
                              className={`p-2 rounded-lg border text-xs text-tg-textDefault cursor-pointer transition select-none flex items-center justify-between relative overflow-hidden ${hasVoted ? 'border-tg-blue/40 bg-tg-blue/10' : 'border-tg-borderDark bg-tg-bgDark hover:bg-tg-bgDark'}`}
                            >
                              <span className="z-10">{opt.text}</span>
                              <span className="text-[10px] text-tg-textMuted z-10">{percent}% ({opt.votes.length})</span>
                              <div className="absolute inset-y-0 left-0 bg-tg-blue/5 transition-all" style={{ width: `${percent}%` }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Plain Text content */}
                  {msg.type !== 'poll' && <p className="text-xs text-left leading-normal">{msg.content}</p>}

                  {/* Bubble footer bar */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {msg.isEdited && <span className="text-[9px] text-tg-textMuted italic">edited</span>}
                    <span className="text-[9px] text-tg-textMuted ml-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {/* Delivery Status checkmarks */}
                    {isSelf && (
                      <span className="text-tg-blue ml-0.5" style={{ fontSize: '10px' }}>
                        {msg.status === 'seen' ? (
                          <CheckIcon fontSize="inherit" className="font-bold" />
                        ) : msg.status === 'sending' ? (
                          <span className="inline-block animate-spin w-2.5 h-2.5 border border-white/40 border-t-white rounded-full mr-0.5" />
                        ) : msg.status === 'failed' ? (
                          <span className="text-red-500 font-bold">⚠️</span>
                        ) : (
                          <CheckIcon fontSize="inherit" className="opacity-40" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Emoji reactions row */}
                  {msg.reactions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 justify-start">
                      {msg.reactions.map((r, rIdx) => (
                        <span
                          key={rIdx}
                          className="text-[10px] bg-black/10 border border-tg-borderDark/25 px-1.5 py-0.5 rounded-full select-none"
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator bubble */}
        {currentTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-tg-textMuted text-[10px] animate-pulse py-1 text-left">
            <span>typing...</span>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* Floating Scroll To Bottom Button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 p-3 rounded-full bg-tg-bgSidebarDark/90 backdrop-blur border border-tg-borderDark text-tg-blue shadow-xl z-20 hover:scale-105 active:scale-95 transition"
          >
            <KeyboardArrowDownIcon />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Uploading progress bar */}
      {uploading && (
        <div className="bg-tg-bgSidebarDark border-t border-tg-borderDark px-6 py-2 flex items-center gap-4 z-20">
          <div className="flex-grow h-1.5 bg-tg-bgDark rounded-full overflow-hidden">
            <div className="h-full bg-tg-blue transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="text-[10px] text-tg-textMuted font-mono">{uploadProgress}%</span>
        </div>
      )}

      {/* Group Poll Creator Drawer Overlay */}
      {showPollCreator && (
        <div className="absolute inset-x-0 bottom-0 bg-tg-bgSidebarDark border-t border-tg-borderDark p-6 z-40 animate-slide-in shadow-2xl rounded-t-3xl max-h-[70%] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Create Group Poll</h3>
            <button
              onClick={() => { setShowPollCreator(false); setPollOptions(['', '']); }}
              className="text-xs text-tg-textMuted hover:text-tg-textDefault"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreatePoll} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Question</label>
              <input
                type="text"
                required
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Options</label>
              {pollOptions.map((opt, oIdx) => (
                <input
                  key={oIdx}
                  type="text"
                  required
                  placeholder={`Option ${oIdx + 1}`}
                  value={opt}
                  onChange={(e) => handlePollOptionChange(oIdx, e.target.value)}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
                />
              ))}
              <button
                type="button"
                onClick={addPollOptionField}
                className="text-[10px] text-tg-blue hover:underline font-bold mt-1 block"
              >
                + Add Option
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
            >
              Launch Poll
            </button>
          </form>
        </div>
      )}

      {/* Message compose bar */}
      <div className="p-4 bg-tg-bgSidebarDark border-t border-tg-borderDark/80 z-30 flex-shrink-0">
        {/* Reply/Edit Indicator bar */}
        {(replyMessage || editMessage) && (
          <div className="bg-tg-bgDark border border-tg-borderDark p-2.5 rounded-xl mb-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              {replyMessage ? <ReplyIcon className="text-tg-blue" /> : <EditIcon className="text-green-500" />}
              <div>
                <span className="text-[10px] text-tg-textMuted uppercase font-bold tracking-wide">
                  {replyMessage ? 'Replying to message' : 'Editing message'}
                </span>
                <p className="text-xs text-tg-textMuted truncate max-w-md">
                  {replyMessage ? replyMessage.content : editMessage.content}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setReplyMessage(null);
                setEditMessage(null);
                setInputContent('');
              }}
              className="text-tg-textMuted hover:text-tg-textDefault transition"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          {/* File attachment upload button */}
          <label className="p-2.5 rounded-xl text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition cursor-pointer flex-shrink-0">
            <input type="file" onChange={handleFileSelect} className="hidden" />
            <AttachFileIcon fontSize="small" />
          </label>

          {/* Group Poll Trigger */}
          {activeChatType === 'group' && (
            <button
              type="button"
              onClick={() => setShowPollCreator(true)}
              className="p-2.5 rounded-xl text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition flex-shrink-0"
              title="Create Poll"
            >
              <InsertChartOutlinedIcon fontSize="small" />
            </button>
          )}

          {/* Message Input field */}
          <input
            type="text"
            required
            value={inputContent}
            placeholder="Type a message..."
            onChange={handleInputChange}
            className="flex-grow px-4 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs placeholder-tg-textMuted"
          />

          <button
            type="submit"
            disabled={isSendingMessage}
            className="p-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white rounded-xl shadow-lg shadow-tg-blue/20 transition flex-shrink-0 active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSendingMessage ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon fontSize="small" />
            )}
          </button>
        </form>
      </div>

      {/* Sleek Context Menu overlay */}
      {activeMenuMsg && (
        <div
          className="fixed z-50 bg-tg-bgSidebarDark/95 backdrop-blur-xl border border-tg-borderDark/80 rounded-2xl shadow-2xl p-2.5 w-[200px] animate-fade-in flex flex-col gap-1.5"
          style={{ top: `${menuCoords.y}px`, left: `${menuCoords.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick reactions */}
          <div className="flex justify-between items-center px-1.5 pb-2 border-b border-tg-borderDark/50">
            {['👍', '🔥', '❤️', '👏', '😮', '😢'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  handleReact(activeMenuMsg._id, emoji);
                  setActiveMenuMsg(null);
                }}
                className="hover:scale-130 transition text-sm active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Action options */}
          <div className="flex flex-col text-left">
            <button
              onClick={() => {
                setReplyMessage(activeMenuMsg);
                setActiveMenuMsg(null);
              }}
              className="w-full flex items-center gap-3 px-2 py-1.5 text-xs text-tg-textDefault hover:bg-tg-bgDark rounded-xl transition"
            >
              <ReplyIcon fontSize="inherit" className="text-tg-textMuted" style={{ fontSize: '13px' }} />
              Reply
            </button>

            {activeMenuMsg.sender._id === user.id && !activeMenuMsg.isTemp && (
              <button
                onClick={() => {
                  setEditMessage(activeMenuMsg);
                  setInputContent(activeMenuMsg.content);
                  setActiveMenuMsg(null);
                }}
                className="w-full flex items-center gap-3 px-2 py-1.5 text-xs text-tg-textDefault hover:bg-tg-bgDark rounded-xl transition"
              >
                <EditIcon fontSize="inherit" className="text-tg-textMuted" style={{ fontSize: '13px' }} />
                Edit Message
              </button>
            )}

            <button
              onClick={() => {
                handleStar(activeMenuMsg._id);
                setActiveMenuMsg(null);
              }}
              className="w-full flex items-center gap-3 px-2 py-1.5 text-xs text-tg-textDefault hover:bg-tg-bgDark rounded-xl transition"
            >
              <StarBorderIcon fontSize="inherit" className="text-yellow-500/85" style={{ fontSize: '13px' }} />
              Star Message
            </button>

            <button
              onClick={() => {
                handlePin(activeMenuMsg._id);
                setActiveMenuMsg(null);
              }}
              className="w-full flex items-center gap-3 px-2 py-1.5 text-xs text-tg-textDefault hover:bg-tg-bgDark rounded-xl transition"
            >
              <PushPinIcon fontSize="inherit" className="text-tg-blue" style={{ fontSize: '13px' }} />
              Pin Message
            </button>

            {!activeMenuMsg.isTemp && (
              <button
                onClick={() => {
                  handleDelete(activeMenuMsg._id);
                  setActiveMenuMsg(null);
                }}
                className="w-full flex items-center gap-3 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition"
              >
                <DeleteIcon fontSize="inherit" style={{ fontSize: '13px' }} />
                Delete Message
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
