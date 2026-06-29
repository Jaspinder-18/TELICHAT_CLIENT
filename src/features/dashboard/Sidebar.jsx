import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setLeftSidebarTab, setTheme, setAlert } from '../../redux/uiSlice.js';
import { setContacts, setMyGroups, setMyChannels, addGroup, addChannel, setActiveChat } from '../../redux/chatSlice.js';
import { logoutUser, updateUserProfile } from '../../redux/authSlice.js';
import { setMyBots, addBot, removeBotState, updateBotTokenState } from '../../redux/botSlice.js';
import api, { getFileUrl } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';

// MUI Icons
import ChatIcon from '@mui/icons-material/Chat';
import GroupsIcon from '@mui/icons-material/Groups';
import CampaignIcon from '@mui/icons-material/Campaign';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ContactsIcon from '@mui/icons-material/Contacts';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import StarIcon from '@mui/icons-material/Star';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import PaletteIcon from '@mui/icons-material/Palette';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const { joinRoom } = useSocket();

  const { leftSidebarTab, theme } = useSelector((state) => state.ui);
  const { contacts, myGroups, myChannels, activeChat } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const { myBots } = useSelector((state) => state.bot);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showJoinChannel, setShowJoinChannel] = useState(false);
  const [joinLinkInput, setJoinLinkInput] = useState('');

  // Group creation form state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupType, setGroupType] = useState('private');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Channel creation state
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelType, setChannelType] = useState('private');

  // Bot creation state
  const [botName, setBotName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [botWelcome, setBotWelcome] = useState('');
  const [botTokenOutput, setBotTokenOutput] = useState('');

  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contactsRes = await api.get('/chat/contacts');
        dispatch(setContacts(contactsRes.data));

        const groupsRes = await api.get('/group');
        dispatch(setMyGroups(groupsRes.data));
        groupsRes.data.forEach(g => joinRoom(g._id));

        const channelsRes = await api.get('/channel');
        dispatch(setMyChannels(channelsRes.data));
        channelsRes.data.forEach(c => joinRoom(c._id));

        try {
          const botsRes = await api.get('/bot/my');
          dispatch(setMyBots(botsRes.data));
        } catch (botErr) {
          console.error('Failed to load bots data', botErr);
        }
      } catch (err) {
        console.error('Failed to load sidebar data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleSelectChat = (chat, type) => {
    dispatch(setActiveChat({ chat, type }));
    joinRoom(chat._id);
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/group', {
        name: groupName,
        description: groupDesc,
        type: groupType,
        memberIds: selectedMembers,
      });
      dispatch(addGroup(res.data));
      joinRoom(res.data._id);
      setGroupName('');
      setGroupDesc('');
      setSelectedMembers([]);
      setShowCreateGroup(false);
      dispatch(setAlert({ message: 'Group created successfully!', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to create group', severity: 'error' }));
    }
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/channel', {
        name: channelName,
        description: channelDesc,
        type: channelType,
      });
      dispatch(addChannel(res.data));
      joinRoom(res.data._id);
      setChannelName('');
      setChannelDesc('');
      setShowCreateChannel(false);
      dispatch(setAlert({ message: 'Channel created successfully!', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to create channel', severity: 'error' }));
    }
  };

  const handleCreateBotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bot/create', {
        name: botName,
        username: botUsername,
        welcomeMessage: botWelcome,
      });
      setBotTokenOutput(res.data.token);
      dispatch(addBot(res.data));
      setBotName('');
      setBotUsername('');
      setBotWelcome('');
      dispatch(setAlert({ message: 'Bot agent created successfully!', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to create bot', severity: 'error' }));
    }
  };

  const handleRegenerateToken = async (id) => {
    if (!window.confirm('Are you sure you want to regenerate the API token for this bot? The old token will be immediately invalidated.')) return;
    try {
      const res = await api.post(`/bot/${id}/token/regenerate`);
      dispatch(updateBotTokenState({ id, token: res.data.token }));
      dispatch(setAlert({ message: 'Token regenerated successfully!', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to regenerate token', severity: 'error' }));
    }
  };

  const handleDeleteBot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bot? This will remove the bot from all groups/channels and cannot be undone.')) return;
    try {
      await api.delete(`/bot/${id}`);
      dispatch(removeBotState(id));
      dispatch(setAlert({ message: 'Bot deleted successfully!', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to delete bot', severity: 'error' }));
    }
  };

  const handleJoinGroupSubmit = async (e) => {
    e.preventDefault();
    if (!joinLinkInput.trim()) return;

    let token = joinLinkInput.trim();
    if (token.includes('/join/group/')) {
      const parts = token.split('/join/group/');
      token = parts[parts.length - 1];
    }

    try {
      const res = await api.post(`/group/join/${token}`);
      const groupData = res.data.group;
      dispatch(addGroup(groupData));
      joinRoom(groupData._id);
      dispatch(setActiveChat({ chat: groupData, type: 'group' }));
      dispatch(setAlert({ message: 'Joined group successfully!', severity: 'success' }));
      setJoinLinkInput('');
      setShowJoinGroup(false);
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to join group via link', severity: 'error' }));
    }
  };

  const handleJoinChannelSubmit = async (e) => {
    e.preventDefault();
    if (!joinLinkInput.trim()) return;

    let token = joinLinkInput.trim();
    if (token.includes('/join/channel/')) {
      const parts = token.split('/join/channel/');
      token = parts[parts.length - 1];
    }

    try {
      const res = await api.post(`/channel/join/token/${token}`);
      const channelData = res.data.channel;
      dispatch(addChannel(channelData));
      joinRoom(channelData._id);
      dispatch(setActiveChat({ chat: channelData, type: 'channel' }));
      dispatch(setAlert({ message: 'Subscribed to channel successfully!', severity: 'success' }));
      setJoinLinkInput('');
      setShowJoinChannel(false);
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to join channel via link', severity: 'error' }));
    }
  };

  const toggleSelectMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Filters
  const filteredContacts = contacts.filter(c =>
    `${c.firstName || ''} ${c.lastName || ''} ${c.username} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = myGroups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChannels = myChannels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabItems = [
    { id: 'chats', icon: <ChatIcon fontSize="small" />, label: 'Chats' },
    { id: 'groups', icon: <GroupsIcon fontSize="small" />, label: 'Groups' },
    { id: 'channels', icon: <CampaignIcon fontSize="small" />, label: 'Channels' },
    { id: 'bots', icon: <SmartToyIcon fontSize="small" />, label: 'Bots' },
    { id: 'contacts', icon: <ContactsIcon fontSize="small" />, label: 'Corporate' },
    { id: 'settings', icon: <SettingsIcon fontSize="small" />, label: 'Settings' }
  ];

  return (
    <div className="w-full h-full flex bg-tg-bgSidebarDark border-r border-tg-borderDark flex-shrink-0 relative overflow-hidden">
      {/* Mini tabs Sidebar */}
      <div className="w-[64px] h-full bg-tg-bgDark/45 backdrop-blur-md flex flex-col items-center justify-between py-5 border-r border-tg-borderDark/40 flex-shrink-0 z-20">
        <div className="flex flex-col gap-6 items-center w-full">
          {/* User profile bubble */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => dispatch(setLeftSidebarTab('settings'))}
            className="w-10 h-10 rounded-2xl bg-tg-blue overflow-hidden flex items-center justify-center border border-tg-blue/20 cursor-pointer shadow-md"
          >
            {user?.profilePhoto ? (
              <img src={getFileUrl(user.profilePhoto)} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">{(user?.firstName || user?.username)?.[0]?.toUpperCase()}</span>
            )}
          </motion.div>

          <div className="flex flex-col gap-3 w-full px-2 relative">
            {tabItems.map((tab) => {
              const active = leftSidebarTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => dispatch(setLeftSidebarTab(tab.id))}
                  className={`p-3 rounded-2xl transition-all duration-300 relative flex items-center justify-center ${active ? 'text-white' : 'text-tg-textMuted hover:text-tg-textDefault hover:bg-tg-bgDark/60'}`}
                  title={tab.label}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute inset-0 bg-tg-blue rounded-2xl -z-10 shadow-lg shadow-tg-blue/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {tab.icon}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => dispatch(logoutUser())}
            className="p-3 rounded-2xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer active:scale-95"
            title="Log Out"
          >
            <LogoutIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Main Tab Content panel */}
      <div className="flex-grow h-full flex flex-col z-10">
        {/* Search header bar */}
        {leftSidebarTab !== 'settings' && (
          <div className="p-4 border-b border-tg-borderDark/50">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 text-tg-textMuted" fontSize="inherit" style={{ fontSize: '14px' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-tg-bgDark/60 border border-tg-borderDark/80 rounded-2xl focus:border-tg-blue focus:ring-1 focus:ring-tg-blue/20 focus:outline-none text-tg-textDefault text-xs placeholder-tg-textMuted/60 transition-all shadow-inner"
              />
            </div>
          </div>
        )}

        {/* Tab Lists */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1">
          {loading ? (
            // Skeleton Loader lists
            <div className="space-y-4 p-2">
              <div className="h-2.5 w-24 bg-tg-borderDark rounded skeleton mb-4" />
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="flex items-center gap-3 py-1">
                  <div className="w-10 h-10 rounded-2xl bg-tg-borderDark skeleton flex-shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-3 w-1/2 bg-tg-borderDark rounded skeleton" />
                    <div className="h-2.5 w-3/4 bg-tg-borderDark rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {leftSidebarTab === 'chats' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <div className="text-[10px] uppercase font-bold text-tg-textMuted px-2 mb-3 tracking-wider">
                    Recent Conversations
                  </div>
                  {filteredContacts.map(c => (
                    <motion.div
                      key={c._id}
                      onClick={() => handleSelectChat(c, 'user')}
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${activeChat?._id === c._id && activeChat?.username ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/15' : 'hover:bg-tg-bgDark/55 border border-transparent hover:border-tg-borderDark/40'}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-tg-bgDark overflow-hidden flex items-center justify-center border border-tg-borderDark/60 text-tg-textDefault font-bold">
                          {c.profilePhoto ? (
                            <img src={getFileUrl(c.profilePhoto)} alt={c.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">{(c.firstName || c.username)[0].toUpperCase()}</span>
                          )}
                        </div>
                        {c.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-tg-bgSidebarDark rounded-full shadow-sm" />
                        )}
                      </div>
                      <div className="flex-grow overflow-hidden text-left">
                        <span className="text-xs font-semibold truncate leading-tight block">
                          {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}` : `@${c.username}`}
                        </span>
                        <p className={`text-[10px] truncate mt-0.5 ${activeChat?._id === c._id && activeChat?.username ? 'text-blue-100' : 'text-tg-textMuted'}`}>
                          {c.department} • {c.employeeId}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {leftSidebarTab === 'groups' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <div className="flex justify-between items-center px-2 mb-3">
                    <span className="text-[10px] uppercase font-bold text-tg-textMuted tracking-wider">My Groups</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowJoinGroup(true)}
                        className="p-1.5 rounded-xl bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition cursor-pointer"
                        title="Join Group"
                      >
                        <LinkIcon fontSize="inherit" style={{ transform: 'rotate(-45deg)' }} />
                      </button>
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="p-1.5 rounded-xl bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition cursor-pointer"
                        title="Create Group"
                      >
                        <AddIcon fontSize="inherit" />
                      </button>
                    </div>
                  </div>

                  {filteredGroups.map(g => (
                    <motion.div
                      key={g._id}
                      onClick={() => handleSelectChat(g, 'group')}
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${activeChat?._id === g._id && !activeChat?.username ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/15' : 'hover:bg-tg-bgDark/55 border border-transparent hover:border-tg-borderDark/40'}`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 overflow-hidden flex items-center justify-center text-white font-bold border border-indigo-500/20 flex-shrink-0">
                        {g.avatar ? (
                          <img src={getFileUrl(g.avatar)} alt={g.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{g.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-grow overflow-hidden text-left">
                        <span className="text-xs font-semibold truncate block leading-tight">{g.name}</span>
                        <p className={`text-[10px] truncate mt-0.5 ${activeChat?._id === g._id && !activeChat?.username ? 'text-indigo-100' : 'text-tg-textMuted'}`}>
                          {g.members.length} members • {g.type}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {leftSidebarTab === 'channels' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <div className="flex justify-between items-center px-2 mb-3">
                    <span className="text-[10px] uppercase font-bold text-tg-textMuted tracking-wider">Channels</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowJoinChannel(true)}
                        className="p-1.5 rounded-xl bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition cursor-pointer"
                        title="Join Channel"
                      >
                        <LinkIcon fontSize="inherit" style={{ transform: 'rotate(-45deg)' }} />
                      </button>
                      <button
                        onClick={() => setShowCreateChannel(true)}
                        className="p-1.5 rounded-xl bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition cursor-pointer"
                        title="Create Channel"
                      >
                        <AddIcon fontSize="inherit" />
                      </button>
                    </div>
                  </div>

                  {filteredChannels.map(c => (
                    <motion.div
                      key={c._id}
                      onClick={() => handleSelectChat(c, 'channel')}
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${activeChat?._id === c._id ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/15' : 'hover:bg-tg-bgDark/55 border border-transparent hover:border-tg-borderDark/40'}`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 overflow-hidden flex items-center justify-center text-white font-bold border border-amber-500/20 flex-shrink-0">
                        {c.avatar ? (
                          <img src={getFileUrl(c.avatar)} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{c.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-grow overflow-hidden text-left">
                        <span className="text-xs font-semibold truncate block leading-tight">{c.name}</span>
                        <p className={`text-[10px] truncate mt-0.5 ${activeChat?._id === c._id ? 'text-amber-100' : 'text-tg-textMuted'}`}>
                          {c.subscribers?.length || 0} subscribers • {c.type}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {leftSidebarTab === 'bots' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] uppercase font-bold text-tg-textMuted tracking-wider">Bot Agents</span>
                    <button
                      onClick={() => setShowCreateBot(true)}
                      className="p-1.5 rounded-xl bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition cursor-pointer"
                      title="Create Bot"
                    >
                      <AddIcon fontSize="inherit" />
                    </button>
                  </div>

                  <div className="space-y-3 px-1">
                    {myBots.length > 0 ? (
                      myBots.map(bot => (
                        <div
                          key={bot._id}
                          className="p-3 bg-tg-bgDark/40 border border-tg-borderDark/60 rounded-2xl text-left space-y-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 overflow-hidden flex items-center justify-center text-white font-bold border border-rose-500/20 flex-shrink-0">
                              <SmartToyIcon fontSize="small" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-tg-textDefault block truncate">{bot.name}</span>
                              <span className="text-[10px] text-tg-textMuted font-mono">@{bot.username}</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-tg-textMuted line-clamp-2 leading-relaxed bg-black/10 p-2 rounded-xl">
                            <strong className="text-tg-textDefault mr-1">Greeting:</strong> {bot.welcomeMessage || 'None'}
                          </div>

                          {/* Token Section */}
                          <div className="bg-tg-bgDark border border-tg-borderDark/60 rounded-xl p-2.5 flex flex-col gap-1 text-[10px] shadow-inner">
                            <span className="text-[8px] uppercase text-tg-textMuted font-bold tracking-wider">API Token</span>
                            <div className="flex items-center justify-between gap-1.5 font-mono text-[9px] break-all select-all text-tg-blue">
                              <span className="truncate flex-grow">{bot.token}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(bot.token);
                                  dispatch(setAlert({ message: 'Token copied to clipboard!', severity: 'success' }));
                                }}
                                className="px-1.5 py-0.5 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue font-bold rounded flex-shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Bot Actions */}
                          <div className="flex gap-2 pt-1 border-t border-tg-borderDark/50">
                            <button
                              onClick={() => handleRegenerateToken(bot._id)}
                              className="flex-1 py-1 bg-tg-bgDark/80 hover:bg-tg-bgDark/60 border border-tg-borderDark/60 rounded-xl text-[9px] font-semibold text-tg-textDefault transition text-center cursor-pointer"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => handleDeleteBot(bot._id)}
                              className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[9px] font-semibold text-red-400 hover:text-red-500 transition text-center cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-tg-bgDark/35 border border-tg-borderDark/60 rounded-2xl text-center">
                        <p className="text-[10px] text-tg-textMuted leading-normal">
                          You haven't created any bot agents yet. Click the "+" button above to generate a new bot.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {leftSidebarTab === 'contacts' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <div className="text-[10px] uppercase font-bold text-tg-textMuted px-2 mb-3 tracking-wider">
                    Corporate Directory
                  </div>
                  {filteredContacts.map(c => (
                    <motion.div
                      key={c._id}
                      onClick={() => handleSelectChat(c, 'user')}
                      whileHover={{ x: 2 }}
                      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-tg-bgDark/55 border border-transparent hover:border-tg-borderDark/40 transition-all"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-tg-bgDark overflow-hidden flex items-center justify-center text-tg-textDefault border border-tg-borderDark/60 relative flex-shrink-0 font-bold">
                        {c.profilePhoto ? (
                          <img src={getFileUrl(c.profilePhoto)} alt={c.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{(c.firstName || c.username)[0].toUpperCase()}</span>
                        )}
                        {c.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-tg-bgSidebarDark rounded-full" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-tg-textDefault block leading-tight">
                          {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}` : `@${c.username}`}
                        </span>
                        <span className="text-[10px] text-tg-textMuted mt-0.5 block">{c.department} • {c.employeeId}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {leftSidebarTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SettingsPanel />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* CREATE GROUP DIALOG */}
      {showCreateGroup && (
        <div className="absolute inset-0 bg-tg-bgSidebarDark z-50 p-6 flex flex-col overflow-y-auto animate-slide-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Create Group</h3>
            <button onClick={() => setShowCreateGroup(false)} className="text-xs text-tg-textMuted hover:text-tg-textDefault">Cancel</button>
          </div>
          <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Group Name</label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Type</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              >
                <option value="private">Private (Invite Only)</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Contacts checkboxes */}
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-2">Select Members</label>
              <div className="max-h-40 overflow-y-auto border border-tg-borderDark rounded-xl p-2 bg-tg-bgDark space-y-1.5">
                {contacts.map(c => (
                  <label key={c._id} className="flex items-center justify-between text-xs text-tg-textMuted hover:text-tg-textDefault cursor-pointer select-none">
                    <span>{c.firstName} {c.lastName}</span>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(c._id)}
                      onChange={() => toggleSelectMember(c._id)}
                      className="rounded bg-tg-bgDark border-tg-borderDark text-tg-blue focus:ring-0"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
            >
              Create Group
            </button>
          </form>
        </div>
      )}

      {/* CREATE CHANNEL DIALOG */}
      {showCreateChannel && (
        <div className="absolute inset-0 bg-tg-bgSidebarDark z-50 p-6 flex flex-col overflow-y-auto animate-slide-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Create Channel</h3>
            <button onClick={() => setShowCreateChannel(false)} className="text-xs text-tg-textMuted hover:text-tg-textDefault">Cancel</button>
          </div>
          <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Channel Name</label>
              <input
                type="text"
                required
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Description</label>
              <textarea
                value={channelDesc}
                onChange={(e) => setChannelDesc(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Type</label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              >
                <option value="private">Private (Invite Link Only)</option>
                <option value="public">Public</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
            >
              Create Channel
            </button>
          </form>
        </div>
      )}

      {/* CREATE BOT DIALOG */}
      {showCreateBot && (
        <div className="absolute inset-0 bg-tg-bgSidebarDark z-50 p-6 flex flex-col overflow-y-auto animate-slide-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Create Bot Agent</h3>
            <button onClick={() => { setShowCreateBot(false); setBotTokenOutput(''); }} className="text-xs text-tg-textMuted hover:text-tg-textDefault">Close</button>
          </div>
          
          {botTokenOutput ? (
            <div className="space-y-4 text-center py-6">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto">
                <QrCode2Icon fontSize="large" />
              </div>
              <h4 className="text-xs font-bold text-tg-textDefault">Bot Created Successfully!</h4>
              <p className="text-[10px] text-tg-textMuted leading-relaxed">
                Save the token below. You must pass this token in the header as <code>x-bot-token</code> to use the Bot APIs.
              </p>
              <div className="bg-tg-bgDark border border-tg-borderDark rounded-xl p-3 select-all text-xs text-green-500 font-mono break-all">
                {botTokenOutput}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateBotSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Bot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Git Notifier"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Username (must end in _bot)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. git_notifier_bot"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Welcome Message</label>
                <textarea
                  value={botWelcome}
                  placeholder="Greeting when a user opens the chat"
                  onChange={(e) => setBotWelcome(e.target.value)}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
              >
                Generate Bot Token
              </button>
            </form>
          )}
        </div>
      )}

      {/* JOIN GROUP DIALOG */}
      {showJoinGroup && (
        <div className="absolute inset-0 bg-tg-bgSidebarDark z-50 p-6 flex flex-col justify-center animate-slide-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Join Group via Link</h3>
            <button 
              onClick={() => { setShowJoinGroup(false); setJoinLinkInput(''); }} 
              className="text-xs text-tg-textMuted hover:text-tg-textDefault"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleJoinGroupSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Invite Link or Token</label>
              <input
                type="text"
                required
                placeholder="Paste token or group join URL..."
                value={joinLinkInput}
                onChange={(e) => setJoinLinkInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault placeholder-tg-textMuted focus:outline-none focus:border-tg-blue"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
            >
              Join Group
            </button>
          </form>
        </div>
      )}

      {/* JOIN CHANNEL DIALOG */}
      {showJoinChannel && (
        <div className="absolute inset-0 bg-tg-bgSidebarDark z-50 p-6 flex flex-col justify-center animate-slide-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-tg-textDefault uppercase tracking-wider">Join Channel via Link</h3>
            <button 
              onClick={() => { setShowJoinChannel(false); setJoinLinkInput(''); }} 
              className="text-xs text-tg-textMuted hover:text-tg-textDefault"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleJoinChannelSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Invite Link or Token</label>
              <input
                type="text"
                required
                placeholder="Paste token or channel join URL..."
                value={joinLinkInput}
                onChange={(e) => setJoinLinkInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault placeholder-tg-textMuted focus:outline-none focus:border-tg-blue"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition shadow-md cursor-pointer"
            >
              Subscribe to Channel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const SettingsPanel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  
  const [settingsTab, setSettingsTab] = useState('profile'); // 'profile' | 'appearance'

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department || '',
    employeeId: user?.employeeId || '',
    gender: user?.gender || 'other'
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(profileForm).forEach(key => {
        data.append(key, profileForm[key]);
      });
      if (photoFile) {
        data.append('profilePhoto', photoFile);
      }

      const res = await api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      dispatch(updateUserProfile(res.data.user));
      dispatch(setAlert({ message: 'Profile updated successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Update failed', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const themesList = [
    { id: 'light', name: 'Light', colors: ['#ffffff', '#e2e8f0', '#3b82f6'] },
    { id: 'dark', name: 'Dark Grey', colors: ['#17212b', '#24303f', '#24a1de'] },
    { id: 'midnight', name: 'Midnight', colors: ['#050505', '#1a1a1a', '#ffffff'] },
    { id: 'blue', name: 'Ocean Blue', colors: ['#1c2541', '#3a506b', '#00b4d8'] },
    { id: 'purple', name: 'Cyber Purple', colors: ['#18112d', '#2b1f4c', '#a78bfa'] },
    { id: 'emerald', name: 'Forest Green', colors: ['#064e3b', '#065f46', '#10b981'] },
    { id: 'corporate', name: 'Corporate', colors: ['#1e293b', '#334155', '#6366f1'] }
  ];

  return (
    <div className="text-left space-y-4.5 animate-slide-in">
      <div className="flex border-b border-tg-borderDark/60 pb-1 mb-2">
        <button
          onClick={() => setSettingsTab('profile')}
          className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition ${settingsTab === 'profile' ? 'text-tg-blue border-b-2 border-tg-blue' : 'text-tg-textMuted hover:text-tg-textDefault'}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <EditIcon style={{ fontSize: '11px' }} />
            Profile
          </div>
        </button>
        <button
          onClick={() => setSettingsTab('appearance')}
          className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition ${settingsTab === 'appearance' ? 'text-tg-blue border-b-2 border-tg-blue' : 'text-tg-textMuted hover:text-tg-textDefault'}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <PaletteIcon style={{ fontSize: '11px' }} />
            Themes
          </div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {settingsTab === 'profile' ? (
          <motion.form
            key="profileTab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleSaveProfile}
            className="space-y-4"
          >
            {/* Photo Upload */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-16 h-16 rounded-2xl bg-tg-bgDark border-2 border-tg-borderDark/60 overflow-hidden flex items-center justify-center relative shadow-inner">
                {photoPreview ? (
                  <img src={getFileUrl(photoPreview)} alt="" className="w-full h-full object-cover" />
                ) : user?.profilePhoto ? (
                  <img src={getFileUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-tg-blue">{(user?.firstName || user?.username)?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <label className="text-[10px] text-tg-blue hover:underline cursor-pointer mt-2 font-bold tracking-wide">
                Change Profile Photo
                <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
              </label>
            </div>

            <div className="space-y-3 bg-tg-bgDark/30 p-4 border border-tg-borderDark/40 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-tg-textMuted font-bold tracking-wider ml-0.5">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-tg-textMuted font-bold tracking-wider ml-0.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-tg-textMuted font-bold tracking-wider ml-0.5">Department</label>
                <input
                  type="text"
                  name="department"
                  value={profileForm.department}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-tg-textMuted font-bold tracking-wider ml-0.5">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={profileForm.employeeId}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue shadow-inner"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] uppercase text-tg-textMuted font-bold tracking-wider ml-0.5">Gender</label>
                <select
                  name="gender"
                  value={profileForm.gender}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-bold rounded-xl transition disabled:opacity-50 active:scale-95 shadow-md cursor-pointer shadow-tg-blue/15"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </motion.button>

            {window.chrome?.webview && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => {
                  window.chrome.webview.postMessage("exit");
                }}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition active:scale-95 shadow-sm cursor-pointer mt-3"
              >
                Exit Desktop Application
              </motion.button>
            )}
          </motion.form>
        ) : (
          <motion.div
            key="appearanceTab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="text-[10px] uppercase font-bold text-tg-textMuted px-1 tracking-wider">
              Select Client Theme
            </div>

            <div className="grid grid-cols-2 gap-2.5 px-0.5">
              {themesList.map((t) => {
                const active = theme === t.id;
                return (
                  <motion.div
                    key={t.id}
                    onClick={() => dispatch(setTheme(t.id))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 bg-tg-bgDark/45 border rounded-2xl cursor-pointer text-left transition-all ${active ? 'border-tg-blue bg-tg-bgDark shadow-md' : 'border-tg-borderDark/60 hover:bg-tg-bgDark/30'}`}
                  >
                    <span className="text-[11px] font-bold text-tg-textDefault block mb-2">{t.name}</span>
                    <div className="flex gap-1.5 items-center">
                      {t.colors.map((color, cIdx) => (
                        <span
                          key={cIdx}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
