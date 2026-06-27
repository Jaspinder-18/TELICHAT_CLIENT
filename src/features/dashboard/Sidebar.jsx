import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLeftSidebarTab, toggleTheme, setAlert } from '../../redux/uiSlice.js';
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contactsRes = await api.get('/chat/contacts');
        dispatch(setContacts(contactsRes.data));

        const groupsRes = await api.get('/group');
        dispatch(setMyGroups(groupsRes.data));
        // Join group rooms automatically on startup
        groupsRes.data.forEach(g => joinRoom(g._id));

        const channelsRes = await api.get('/channel');
        dispatch(setMyChannels(channelsRes.data));
        // Join channel rooms automatically on startup
        channelsRes.data.forEach(c => joinRoom(c._id));

        try {
          const botsRes = await api.get('/bot/my');
          dispatch(setMyBots(botsRes.data));
        } catch (botErr) {
          console.error('Failed to load bots data', botErr);
        }
      } catch (err) {
        console.error('Failed to load sidebar data', err);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleSelectChat = (chat, type) => {
    dispatch(setActiveChat({ chat, type }));
    joinRoom(chat._id); // Ensure we join room
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

  return (
    <div className="w-full h-full flex bg-tg-bgSidebarDark border-r border-tg-borderDark flex-shrink-0 relative overflow-hidden">
      {/* Mini tabs Sidebar */}
      <div className="w-[60px] h-full bg-tg-bgDark flex flex-col items-center justify-between py-4 border-r border-tg-borderDark flex-shrink-0 z-20">
        <div className="flex flex-col gap-5 items-center">
          {/* User profile bubble */}
          <div
            onClick={() => dispatch(setLeftSidebarTab('settings'))}
            className="w-9 h-9 rounded-full bg-tg-blue overflow-hidden flex items-center justify-center border border-tg-blue/20 cursor-pointer shadow-md"
          >
            {user?.profilePhoto ? (
              <img src={getFileUrl(user.profilePhoto)} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">{(user?.firstName || user?.username)?.[0]?.toUpperCase()}</span>
            )}
          </div>

          <button
            onClick={() => dispatch(setLeftSidebarTab('chats'))}
            className={`p-2 rounded-xl transition ${leftSidebarTab === 'chats' ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/20' : 'text-tg-textMuted hover:bg-tg-bgDark'}`}
          >
            <ChatIcon fontSize="small" />
          </button>
          <button
            onClick={() => dispatch(setLeftSidebarTab('groups'))}
            className={`p-2 rounded-xl transition ${leftSidebarTab === 'groups' ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/20' : 'text-tg-textMuted hover:bg-tg-bgDark'}`}
          >
            <GroupsIcon fontSize="small" />
          </button>
          <button
            onClick={() => dispatch(setLeftSidebarTab('channels'))}
            className={`p-2 rounded-xl transition ${leftSidebarTab === 'channels' ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/20' : 'text-tg-textMuted hover:bg-tg-bgDark'}`}
          >
            <CampaignIcon fontSize="small" />
          </button>
          <button
            onClick={() => dispatch(setLeftSidebarTab('bots'))}
            className={`p-2 rounded-xl transition ${leftSidebarTab === 'bots' ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/20' : 'text-tg-textMuted hover:bg-tg-bgDark'}`}
          >
            <SmartToyIcon fontSize="small" />
          </button>
          <button
            onClick={() => dispatch(setLeftSidebarTab('contacts'))}
            className={`p-2 rounded-xl transition ${leftSidebarTab === 'contacts' ? 'bg-tg-blue text-white shadow-lg shadow-tg-blue/20' : 'text-tg-textMuted hover:bg-tg-bgDark'}`}
          >
            <ContactsIcon fontSize="small" />
          </button>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-xl text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition"
          >
            {theme === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </button>
          <button
            onClick={() => dispatch(logoutUser())}
            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition"
          >
            <LogoutIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Main Tab Content panel */}
      <div className="flex-grow h-full flex flex-col z-10">
        {/* Search header bar */}
        <div className="p-4 border-b border-tg-borderDark/80">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 text-gray-500" fontSize="inherit" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl focus:border-tg-blue focus:outline-none text-tg-textDefault text-xs placeholder-tg-textMuted"
            />
          </div>
        </div>

        {/* Tab Lists */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {leftSidebarTab === 'chats' && (
            <>
              <div className="text-[10px] uppercase font-bold text-tg-textMuted px-3 mb-2 tracking-wider">
                Recent Conversations
              </div>
              {filteredContacts.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleSelectChat(c, 'user')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${activeChat?._id === c._id && activeChat?.username ? 'bg-tg-blue text-white' : 'hover:bg-tg-bgDark'}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-tg-bgDark overflow-hidden flex items-center justify-center border border-tg-borderDark text-tg-textDefault">
                      {c.profilePhoto ? (
                        <img src={getFileUrl(c.profilePhoto)} alt={c.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold">{(c.firstName || c.username)[0].toUpperCase()}</span>
                      )}
                    </div>
                    {c.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-tg-bgSidebarDark rounded-full" />
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}` : `@${c.username}`}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${activeChat?._id === c._id && activeChat?.username ? 'text-blue-100' : 'text-tg-textMuted'}`}>
                      {c.department} • {c.employeeId}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {leftSidebarTab === 'groups' && (
            <>
              <div className="flex justify-between items-center px-3 mb-2">
                <span className="text-[10px] uppercase font-bold text-tg-textMuted tracking-wider">My Groups</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowJoinGroup(true)}
                    className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition"
                    title="Join Group via Link"
                  >
                    <LinkIcon fontSize="inherit" style={{ transform: 'rotate(-45deg)' }} />
                  </button>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition"
                    title="Create Group"
                  >
                    <AddIcon fontSize="inherit" />
                  </button>
                </div>
              </div>

              {filteredGroups.map(g => (
                <div
                  key={g._id}
                  onClick={() => handleSelectChat(g, 'group')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${activeChat?._id === g._id && !activeChat?.username ? 'bg-tg-blue text-white' : 'hover:bg-tg-bgDark'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 overflow-hidden flex items-center justify-center text-white font-bold border border-indigo-500/20">
                    {g.avatar ? (
                      <img src={getFileUrl(g.avatar)} alt={g.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{g.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <span className="text-xs font-semibold truncate block leading-tight">{g.name}</span>
                    <p className={`text-[10px] truncate mt-0.5 ${activeChat?._id === g._id && !activeChat?.username ? 'text-indigo-100' : 'text-tg-textMuted'}`}>
                      {g.members.length} members • {g.type}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {leftSidebarTab === 'channels' && (
            <>
              <div className="flex justify-between items-center px-3 mb-2">
                <span className="text-[10px] uppercase font-bold text-tg-textMuted tracking-wider">Channels</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowJoinChannel(true)}
                    className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition"
                    title="Join Channel via Link"
                  >
                    <LinkIcon fontSize="inherit" style={{ transform: 'rotate(-45deg)' }} />
                  </button>
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition"
                    title="Create Channel"
                  >
                    <AddIcon fontSize="inherit" />
                  </button>
                </div>
              </div>

              {filteredChannels.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleSelectChat(c, 'channel')}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${activeChat?._id === c._id ? 'bg-tg-blue text-white' : 'hover:bg-tg-bgDark'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 overflow-hidden flex items-center justify-center text-white font-bold border border-amber-500/20">
                    {c.avatar ? (
                      <img src={getFileUrl(c.avatar)} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <span className="text-xs font-semibold truncate block leading-tight">{c.name}</span>
                    <p className={`text-[10px] truncate mt-0.5 ${activeChat?._id === c._id ? 'text-amber-100' : 'text-tg-textMuted'}`}>
                      {c.subscribers?.length || 0} subscribers
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {leftSidebarTab === 'bots' && (
            <>
              <div className="flex justify-between items-center px-3 mb-2">
                <span className="text-[10px] uppercase font-bold text-tg-textMuted tracking-wider">Bot Management</span>
                <button
                  onClick={() => setShowCreateBot(true)}
                  className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition flex items-center justify-center"
                  title="Create Bot Agent"
                >
                  <AddIcon fontSize="inherit" />
                </button>
              </div>

              {/* Bot List */}
              <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-120px)] p-2">
                {myBots && myBots.length > 0 ? (
                  myBots.map((bot) => (
                    <div
                      key={bot._id}
                      className="p-3 bg-tg-bgDark/40 border border-tg-borderDark/80 rounded-xl space-y-2 hover:bg-tg-bgDark/60 transition text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-tg-textDefault block leading-tight">
                            {bot.name}
                          </span>
                          <span className="text-[9px] text-tg-textMuted font-mono">
                            @{bot.username}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          Active
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-tg-textMuted line-clamp-2 leading-relaxed">
                        <strong className="text-tg-textDefault">Welcome:</strong> {bot.welcomeMessage || 'None'}
                      </div>

                      {/* Token Section */}
                      <div className="bg-tg-bgDark border border-tg-borderDark rounded-lg p-2 flex flex-col gap-1 text-[10px]">
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
                          className="flex-1 py-1 bg-tg-bgDark hover:bg-tg-bgDark/80 border border-tg-borderDark rounded-lg text-[9px] font-semibold text-tg-textDefault transition text-center"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => handleDeleteBot(bot._id)}
                          className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[9px] font-semibold text-red-400 hover:text-red-500 transition text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-tg-bgDark border border-tg-borderDark rounded-xl m-2 space-y-3 text-center">
                    <p className="text-[10px] text-tg-textMuted leading-normal">
                      You haven't created any bot agents yet. Click the "+" button above to generate a new bot.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {leftSidebarTab === 'contacts' && (
            <>
              <div className="text-[10px] uppercase font-bold text-tg-textMuted px-3 mb-2 tracking-wider">
                Corporate Directory
              </div>
              {filteredContacts.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleSelectChat(c, 'user')}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-tg-bgDark transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-tg-bgDark overflow-hidden flex items-center justify-center text-tg-textDefault border border-tg-borderDark relative">
                    {c.profilePhoto ? (
                      <img src={getFileUrl(c.profilePhoto)} alt={c.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">{(c.firstName || c.username)[0].toUpperCase()}</span>
                    )}
                    {c.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-tg-bgSidebarDark rounded-full" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-tg-textDefault block">
                      {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}` : `@${c.username}`}
                    </span>
                    <span className="text-[10px] text-tg-textMuted">{c.department} • {c.employeeId}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {leftSidebarTab === 'settings' && (
            <SettingsPanel />
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
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Type</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              >
                <option value="private">Private (Invite Only)</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Contacts checkboxes */}
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-2">Select Members</label>
              <div className="max-h-40 overflow-y-auto border border-tg-borderDark rounded-lg p-2 bg-tg-bgDark space-y-1.5">
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
              className="w-full py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-lg transition"
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
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Description</label>
              <textarea
                value={channelDesc}
                onChange={(e) => setChannelDesc(e.target.value)}
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Type</label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value)}
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
              >
                <option value="private">Private (Invite Link Only)</option>
                <option value="public">Public</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-lg transition"
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
            <div className="space-y-4 text-center">
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
                  className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
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
                  className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-tg-textMuted font-bold mb-1">Welcome Message</label>
                <textarea
                  value={botWelcome}
                  placeholder="Greeting when a user opens the chat"
                  onChange={(e) => setBotWelcome(e.target.value)}
                  className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-lg transition"
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
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault placeholder-tg-textMuted focus:outline-none focus:border-tg-blue"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-lg transition"
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
                className="w-full px-3 py-2 bg-tg-bgDark border border-tg-borderDark rounded-lg text-xs text-tg-textDefault placeholder-tg-textMuted focus:outline-none focus:border-tg-blue"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-lg transition"
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

  return (
    <div className="p-4 text-left space-y-5 animate-slide-in">
      <div className="text-[10px] uppercase font-bold text-tg-textMuted mb-2 tracking-wider">
        Profile Settings
      </div>
      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* Photo Upload */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-tg-bgDark border-2 border-tg-borderDark overflow-hidden flex items-center justify-center relative shadow-inner">
            {photoPreview ? (
              <img src={getFileUrl(photoPreview)} alt="" className="w-full h-full object-cover" />
            ) : user?.profilePhoto ? (
              <img src={getFileUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-tg-blue">{(user?.firstName || user?.username)?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <label className="text-[10px] text-tg-blue hover:underline cursor-pointer mt-1.5 font-semibold">
            Change Photo
            <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </label>
        </div>

        <div>
          <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">First Name</label>
          <input
            type="text"
            name="firstName"
            value={profileForm.firstName}
            onChange={handleProfileChange}
            className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={profileForm.lastName}
            onChange={handleProfileChange}
            className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Department</label>
          <input
            type="text"
            name="department"
            value={profileForm.department}
            onChange={handleProfileChange}
            className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Employee ID</label>
          <input
            type="text"
            name="employeeId"
            value={profileForm.employeeId}
            onChange={handleProfileChange}
            className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Gender</label>
          <select
            name="gender"
            value={profileForm.gender}
            onChange={handleProfileChange}
            className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 active:scale-95 shadow-md"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
};

export default Sidebar;
