import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsReadAsync,
  markAllAsReadAsync,
  deleteNotificationAsync
} from '../redux/notificationSlice';
import { setActiveChat } from '../redux/chatSlice';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageIcon from '@mui/icons-material/Message';
import CallIcon from '@mui/icons-material/Call';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function NotificationCenter() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, totalPages, currentPage } = useSelector(
    (state) => state.notifications
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);

  // Poll for unread count every 30 seconds as backup
  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Load notifications when dropdown opens or filter changes
  useEffect(() => {
    if (isOpen) {
      dispatch(
        fetchNotifications({
          page,
          search,
          priority: priorityFilter
        })
      );
    }
  }, [isOpen, page, search, priorityFilter, dispatch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    // 1. Mark as read
    if (!n.readStatus) {
      dispatch(markAsReadAsync([n._id]));
    }

    // 2. Navigate based on target chat type
    if (n.channel) {
      dispatch(setActiveChat({ chat: n.channel, type: 'channel' }));
    } else if (n.group) {
      dispatch(setActiveChat({ chat: n.group, type: 'group' }));
    } else if (n.sender) {
      dispatch(setActiveChat({ chat: n.sender, type: 'user' }));
    }

    setIsOpen(false);
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'low': return 'bg-green-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-600 animate-pulse';
      default: return 'bg-tg-blue';
    }
  };

  const getTypeIcon = (type) => {
    if (type.includes('message') || type.includes('reply') || type.includes('mention')) {
      return <MessageIcon className="text-tg-blue" style={{ fontSize: '16px' }} />;
    }
    if (type.includes('call')) {
      return <CallIcon className="text-emerald-500" style={{ fontSize: '16px' }} />;
    }
    if (type.includes('group') || type.includes('channel')) {
      return <GroupIcon className="text-purple-400" style={{ fontSize: '16px' }} />;
    }
    if (type.includes('bot')) {
      return <SmartToyIcon className="text-indigo-400" style={{ fontSize: '16px' }} />;
    }
    if (type.includes('task') || type.includes('approval')) {
      return <AssignmentIcon className="text-amber-500" style={{ fontSize: '16px' }} />;
    }
    return <SecurityIcon className="text-red-400" style={{ fontSize: '16px' }} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-tg-textMuted hover:text-color-text transition outline-none"
      >
        <NotificationsIcon 
          className={`transition ${unreadCount > 0 ? 'animate-bounce text-tg-blue' : ''}`} 
          style={{ fontSize: '22px' }} 
        />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-tg-blue text-[9px] font-bold text-white ring-2 ring-tg-sidebar animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-85 bg-tg-sidebar border border-tg-borderDark/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-slide-in">
          {/* Header */}
          <div className="p-3.5 border-b border-tg-borderDark/60 flex items-center justify-between bg-tg-borderDark/10">
            <h3 className="font-bold text-sm text-color-text">Notifications</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(markAllAsReadAsync())}
                title="Mark all read"
                className="text-tg-textMuted hover:text-tg-blue transition"
              >
                <DoneAllIcon style={{ fontSize: '16px' }} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-tg-textMuted hover:text-color-text transition"
              >
                <CloseIcon style={{ fontSize: '16px' }} />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-2 border-b border-tg-borderDark/40 flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2 text-tg-textMuted" style={{ fontSize: '14px' }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-tg-chat border border-tg-borderDark/60 text-xs rounded-lg pl-7 pr-2.5 py-1.5 outline-none text-color-text focus:ring-1 focus:ring-tg-blue"
              />
            </div>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-tg-chat border border-tg-borderDark/60 text-[10px] text-color-text rounded-lg p-1.5 outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* List Area */}
          <div className="overflow-y-auto flex-1 divide-y divide-tg-borderDark/30 custom-scrollbar max-h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-tg-textMuted">
                No notifications found
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 flex items-start gap-3 transition cursor-pointer hover:bg-tg-borderDark/20 ${!n.readStatus ? 'bg-tg-blue/5' : ''}`}
                >
                  {/* Priority Indicator Dot */}
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${getPriorityColor(n.priority)}`} />

                  {/* Icon or Avatar */}
                  <div className="w-8 h-8 rounded-full bg-tg-borderDark/40 flex items-center justify-center shrink-0 border border-tg-borderDark/60">
                    {n.sender?.profilePhoto ? (
                      <img
                        src={n.sender.profilePhoto}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getTypeIcon(n.notificationType)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-color-text truncate">
                        {n.title}
                      </span>
                      <span className="text-[9px] text-tg-textMuted shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-tg-textMuted line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                  </div>

                  {/* Close / Action Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteNotificationAsync(n._id));
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-tg-textMuted p-1 self-center"
                    style={{ transition: 'opacity 0.2s' }}
                  >
                    <DeleteIcon style={{ fontSize: '13px' }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
