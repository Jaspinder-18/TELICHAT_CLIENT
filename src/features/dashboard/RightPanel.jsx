import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setRightSidebarOpen, setAlert } from '../../redux/uiSlice.js';
import { updateGroup, updateChannel } from '../../redux/chatSlice.js';
import api, { getFileUrl } from '../../services/api.js';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PermContactCalendarIcon from '@mui/icons-material/PermContactCalendar';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export const RightPanel = () => {
  const dispatch = useDispatch();
  const { activeChat, activeChatType, contacts, messages } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const { rightSidebarOpen } = useSelector((state) => state.ui);

  const [sharedFiles, setSharedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'files' | 'media'

  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupType, setGroupType] = useState('private');
  const [groupAvatarFile, setGroupAvatarFile] = useState(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState('');
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Sync group details when activeChat changes
  useEffect(() => {
    if (activeChat && activeChatType === 'group') {
      setGroupName(activeChat.name || '');
      setGroupDesc(activeChat.description || '');
      setGroupType(activeChat.type || 'private');
      setGroupAvatarPreview(activeChat.avatar || '');
      setGroupAvatarFile(null);
      setIsEditingGroup(false);
      setShowAddMemberPanel(false);
      setMemberSearchQuery('');
      setContactSearchQuery('');
    }
  }, [activeChat, activeChatType]);

  // Derive shared files from Redux messages list
  useEffect(() => {
    if (!activeChat) return;

    if (activeChatType === 'group') {
      const groupFiles = messages
        .filter(m => m.type === 'file' && m.file && m.recipientGroup === activeChat._id)
        .map(m => m.file);
      setSharedFiles(groupFiles);
    } else if (activeChatType === 'user') {
      const userFiles = messages
        .filter(m => m.type === 'file' && m.file && (
          (m.sender?._id === user.id && m.recipientUser === activeChat._id) ||
          (m.sender?._id === activeChat._id && m.recipientUser === user.id) ||
          (m.sender === user.id && m.recipientUser === activeChat._id) ||
          (m.sender === activeChat._id && m.recipientUser === user.id)
        ))
        .map(m => {
          const fileCopy = { ...m.file };
          if (!fileCopy.uploader) {
            fileCopy.uploader = m.sender;
          }
          return fileCopy;
        });
      setSharedFiles(userFiles);
    }
  }, [activeChat, activeChatType, messages, user.id]);

  const handleSaveGroupDetails = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', groupName);
      data.append('description', groupDesc);
      data.append('type', groupType);
      if (groupAvatarFile) {
        data.append('avatar', groupAvatarFile);
      }

      const res = await api.put(`/group/${activeChat._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      dispatch(updateGroup(res.data));
      setIsEditingGroup(false);
      dispatch(setAlert({ message: 'Group details updated successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to update group', severity: 'error' }));
    }
  };

  const handleGroupAvatarUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupAvatarFile(file);
      setGroupAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await api.post(`/group/${activeChat._id}/member`, { userId });
      dispatch(updateGroup(res.data));
      dispatch(setAlert({ message: 'Member added successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to add member', severity: 'error' }));
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await api.delete(`/group/${activeChat._id}/member/${userId}`);
      dispatch(updateGroup(res.data));
      dispatch(setAlert({ message: 'Member removed successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to remove member', severity: 'error' }));
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      const res = await api.put(`/group/${activeChat._id}/member/role`, { userId, role });
      dispatch(updateGroup(res.data));
      dispatch(setAlert({ message: 'Member role updated', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to update role', severity: 'error' }));
    }
  };

  const handleToggleAnnouncementMode = async () => {
    try {
      const res = await api.put(`/group/${activeChat._id}/announcement`);
      dispatch(updateGroup(res.data));
      dispatch(setAlert({ message: `Announcement mode ${res.data.announcementMode ? 'enabled' : 'disabled'}`, severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to toggle announcement mode', severity: 'error' }));
    }
  };

  const handleAddSubscriber = async (userId) => {
    try {
      const res = await api.post(`/channel/${activeChat._id}/subscriber`, { userId });
      dispatch(updateChannel(res.data));
      dispatch(setAlert({ message: 'Subscriber added successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to add subscriber', severity: 'error' }));
    }
  };

  const handleRemoveSubscriber = async (userId) => {
    try {
      const res = await api.delete(`/channel/${activeChat._id}/subscriber/${userId}`);
      dispatch(updateChannel(res.data));
      dispatch(setAlert({ message: 'Subscriber removed successfully', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to remove subscriber', severity: 'error' }));
    }
  };

  if (!rightSidebarOpen || !activeChat) return null;

  const imagesOnly = sharedFiles.filter(f => f.mimeType?.startsWith('image/'));
  const docsOnly = sharedFiles.filter(f => !f.mimeType?.startsWith('image/'));

  // Group Admin checks
  const isGroupAdmin = activeChatType === 'group' && activeChat.members.some(m => m.user._id === user.id && (m.role === 'admin' || m.role === 'owner'));
  const isGroupOwner = activeChatType === 'group' && activeChat.members.some(m => m.user._id === user.id && m.role === 'owner');
  const isChannelCreator = activeChatType === 'channel' && activeChat.creator === user.id;

  // Filters for member search
  const filteredGroupMembers = activeChatType === 'group' ? activeChat.members.filter(m => 
    `${m.user.firstName || ''} ${m.user.lastName || ''} ${m.user.username}`.toLowerCase().includes(memberSearchQuery.toLowerCase())
  ) : [];

  const filteredChannelSubscribers = activeChatType === 'channel' ? activeChat.subscribers.filter(s => 
    `${s.firstName || ''} ${s.lastName || ''} ${s.username}`.toLowerCase().includes(memberSearchQuery.toLowerCase())
  ) : [];

  // Contacts available to add (not in group/channel yet)
  const addableContacts = contacts.filter(c => {
    if (activeChatType === 'group') {
      return !activeChat.members.some(m => m.user._id === c._id) && 
        `${c.firstName || ''} ${c.lastName || ''} ${c.username}`.toLowerCase().includes(contactSearchQuery.toLowerCase());
    } else if (activeChatType === 'channel') {
      return !activeChat.subscribers.some(s => s._id === c._id) && 
        `${c.firstName || ''} ${c.lastName || ''} ${c.username}`.toLowerCase().includes(contactSearchQuery.toLowerCase());
    }
    return false;
  });

  const tabItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'files', label: `Files (${docsOnly.length})` },
    { id: 'media', label: `Media (${imagesOnly.length})` }
  ];

  return (
    <div className="w-full sm:w-[320px] h-full bg-tg-bgSidebarDark border-l border-tg-borderDark flex flex-col z-30 flex-shrink-0 animate-slide-in shadow-2xl relative">
      {/* Header */}
      <div className="h-[60px] border-b border-tg-borderDark flex items-center justify-between px-4 flex-shrink-0">
        <h4 className="text-xs font-bold text-tg-textDefault uppercase tracking-wider">Info Details</h4>
        <button
          onClick={() => dispatch(setRightSidebarOpen(false))}
          className="p-1.5 rounded-xl text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition cursor-pointer"
        >
          <CloseIcon fontSize="small" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-tg-borderDark text-[10px] uppercase font-bold text-center flex-shrink-0 relative">
        {tabItems.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 transition relative ${active ? 'text-tg-blue' : 'text-tg-textMuted hover:text-tg-textDefault'}`}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="rightPanelTabIndicator"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-tg-blue"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Viewport content */}
      <div className="flex-grow overflow-y-auto p-4.5 text-left">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {/* Avatar Display */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-tg-blue/10 border border-tg-blue/20 overflow-hidden flex items-center justify-center text-tg-blue font-bold text-2xl mb-3 shadow-md flex-shrink-0">
                  {activeChat.profilePhoto || activeChat.avatar ? (
                    <img src={getFileUrl(activeChat.profilePhoto || activeChat.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(activeChat.firstName || activeChat.name || activeChat.username || '?')[0].toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-tg-textDefault">
                  {activeChatType === 'user' 
                    ? (activeChat.firstName || activeChat.lastName ? `${activeChat.firstName || ''} ${activeChat.lastName || ''}`.trim() : `@${activeChat.username}`)
                    : activeChat.name}
                </h3>
                <p className="text-[10px] text-tg-textMuted mt-1 font-medium tracking-wide">
                  {activeChatType === 'user' ? `@${activeChat.username}` : 'Corporate Resource'}
                </p>
              </div>

              {/* Profile fields list */}
              {activeChatType === 'user' ? (
                <div className="space-y-4 pt-4 border-t border-tg-borderDark/60">
                  <div className="flex items-start gap-3">
                    <PermIdentityIcon className="text-tg-blue mt-0.5" fontSize="small" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Employee ID</span>
                      <span className="text-xs text-tg-textDefault font-medium">{activeChat.employeeId || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CorporateFareIcon className="text-tg-blue mt-0.5" fontSize="small" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Department</span>
                      <span className="text-xs text-tg-textDefault font-medium">{activeChat.department || 'General'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <PermContactCalendarIcon className="text-tg-blue mt-0.5" fontSize="small" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Email Contact</span>
                      <span className="text-xs text-tg-textDefault break-all font-medium">{activeChat.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Group or Channel Management panel */
                <div className="space-y-5 pt-4 border-t border-tg-borderDark/60">
                  <div className="bg-tg-bgDark/35 border border-tg-borderDark/50 rounded-2xl p-3 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Description</span>
                    <p className="text-xs text-tg-textDefault leading-relaxed">
                      {activeChat.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Group Invite Link card for Admin */}
                  {activeChatType === 'group' && isGroupAdmin && activeChat.inviteToken && (
                    <div className="bg-tg-bgDark/35 border border-tg-borderDark/50 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Group Invite Link</span>
                        <button
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/join/group/${activeChat.inviteToken}`;
                            navigator.clipboard.writeText(inviteUrl);
                            dispatch(setAlert({ message: 'Group invite link copied!', severity: 'success' }));
                          }}
                          className="text-[9px] text-tg-blue hover:underline font-bold uppercase cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-[10px] text-tg-textDefault break-all font-mono leading-normal bg-black/15 p-2 rounded-xl border border-tg-borderDark/30">
                        {`${window.location.origin}/join/group/${activeChat.inviteToken}`}
                      </p>
                    </div>
                  )}

                  {/* Channel Invite Link card for Creator */}
                  {activeChatType === 'channel' && isChannelCreator && activeChat.inviteToken && (
                    <div className="bg-tg-bgDark/35 border border-tg-borderDark/50 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Channel Invite Link</span>
                        <button
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/join/channel/${activeChat.inviteToken}`;
                            navigator.clipboard.writeText(inviteUrl);
                            dispatch(setAlert({ message: 'Channel invite link copied!', severity: 'success' }));
                          }}
                          className="text-[9px] text-tg-blue hover:underline font-bold uppercase cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-[10px] text-tg-textDefault break-all font-mono leading-normal bg-black/15 p-2 rounded-xl border border-tg-borderDark/30">
                        {`${window.location.origin}/join/channel/${activeChat.inviteToken}`}
                      </p>
                    </div>
                  )}

                  {/* Group Edit form if admin/owner */}
                  {activeChatType === 'group' && isGroupAdmin && (
                    <div className="border-t border-tg-borderDark/50 pt-3">
                      {!isEditingGroup ? (
                        <button
                          onClick={() => setIsEditingGroup(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-tg-bgDark border border-tg-borderDark hover:bg-tg-bgDark/60 text-tg-textDefault rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          <EditIcon fontSize="inherit" style={{ fontSize: '13px' }} />
                          Edit Group Settings
                        </button>
                      ) : (
                        <form onSubmit={handleSaveGroupDetails} className="space-y-3.5">
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-tg-bgDark overflow-hidden flex items-center justify-center border border-tg-borderDark shadow-inner">
                              {groupAvatarPreview ? (
                                <img src={getFileUrl(groupAvatarPreview)} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-bold">{groupName[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <label className="text-[10px] text-tg-blue hover:underline cursor-pointer mt-1.5 font-bold">
                              Upload Photo
                              <input type="file" onChange={handleGroupAvatarUpload} className="hidden" accept="image/*" />
                            </label>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] uppercase font-bold text-tg-textMuted ml-0.5">Group Name</label>
                            <input
                              type="text"
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] uppercase font-bold text-tg-textMuted ml-0.5">Description</label>
                            <textarea
                              value={groupDesc}
                              onChange={(e) => setGroupDesc(e.target.value)}
                              className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs h-14 resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingGroup(false)}
                              className="flex-1 py-2 bg-tg-bgDark hover:bg-tg-bgDark/60 border border-tg-borderDark rounded-xl text-xs text-tg-textDefault cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Announcement mode toggle (channels or group admin settings) */}
                  {activeChatType === 'group' && isGroupOwner && (
                    <div className="flex items-center justify-between p-3 bg-tg-bgDark/35 border border-tg-borderDark/50 rounded-2xl shadow-inner">
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-tg-textDefault block">Announcement Mode</span>
                        <span className="text-[8px] text-tg-textMuted block mt-0.5">Only admins can post messages</span>
                      </div>
                      <button
                        onClick={handleToggleAnnouncementMode}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${activeChat.announcementMode ? 'bg-tg-blue' : 'bg-tg-bgDark border border-tg-borderDark'}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${activeChat.announcementMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  )}

                  {/* Member / Subscriber List Area */}
                  <div className="border-t border-tg-borderDark/60 pt-4 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-tg-textMuted uppercase tracking-wider">
                        {activeChatType === 'group' ? 'Members' : 'Subscribers'}
                      </span>
                      {((activeChatType === 'group' && isGroupAdmin) || (activeChatType === 'channel' && isChannelCreator)) && (
                        <button
                          onClick={() => setShowAddMemberPanel(!showAddMemberPanel)}
                          className="p-1 rounded-xl text-tg-blue bg-tg-blue/10 hover:bg-tg-blue/20 transition cursor-pointer"
                          title="Add Member"
                        >
                          <PersonAddIcon fontSize="small" style={{ fontSize: '13px' }} />
                        </button>
                      )}
                    </div>

                    {/* Member Add Overlay Drawer */}
                    {showAddMemberPanel && (
                      <div className="bg-tg-bgDark border border-tg-borderDark p-3 rounded-2xl space-y-3 shadow-inner">
                        <div className="relative">
                          <SearchIcon className="absolute left-2.5 top-2 text-tg-textMuted" fontSize="inherit" style={{ fontSize: '12px' }} />
                          <input
                            type="text"
                            placeholder="Search contacts..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="w-full pl-7 pr-3 py-1 bg-tg-bgSidebarDark border border-tg-borderDark/80 rounded-xl text-[10px]"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 p-1">
                          {addableContacts.length > 0 ? (
                            addableContacts.map(c => (
                              <div key={c._id} className="flex items-center justify-between gap-1 text-[11px]">
                                <span className="truncate text-tg-textDefault font-medium">
                                  {c.firstName || c.lastName ? `${c.firstName} ${c.lastName}` : `@${c.username}`}
                                </span>
                                <button
                                  onClick={() => activeChatType === 'group' ? handleAddMember(c._id) : handleAddSubscriber(c._id)}
                                  className="px-2 py-0.5 bg-tg-blue hover:bg-tg-darkBlue text-white font-bold rounded-lg text-[9px] cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-tg-textMuted block text-center py-2">No contacts to add</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <SearchIcon className="absolute left-2 top-2.5 text-tg-textMuted" fontSize="inherit" style={{ fontSize: '12px' }} />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-tg-bgDark/40 border border-tg-borderDark rounded-xl text-[10px]"
                      />
                    </div>

                    {/* Member directory listings */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {activeChatType === 'group' ? (
                        filteredGroupMembers.map(m => (
                          <div key={m.user._id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-7 h-7 rounded-xl bg-tg-bgDark flex items-center justify-center font-bold text-[10px] border border-tg-borderDark/80">
                                {m.user.profilePhoto ? (
                                  <img src={getFileUrl(m.user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{m.user.firstName?.[0]?.toUpperCase() || m.user.username[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <div className="text-left overflow-hidden">
                                <span className="font-semibold block truncate leading-tight">
                                  {m.user.firstName || m.user.lastName ? `${m.user.firstName} ${m.user.lastName}` : `@${m.user.username}`}
                                </span>
                                <span className="text-[8px] text-tg-textMuted font-mono">{m.role}</span>
                              </div>
                            </div>
                            
                            {/* Admin actions over members */}
                            {isGroupAdmin && m.user._id !== user.id && m.role !== 'owner' && (
                              <div className="flex gap-1.5">
                                <select
                                  value={m.role}
                                  onChange={(e) => handleUpdateRole(m.user._id, e.target.value)}
                                  className="bg-tg-bgDark border border-tg-borderDark rounded p-0.5 text-[8px] font-bold text-tg-textMuted cursor-pointer"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveMember(m.user._id)}
                                  className="text-red-400 hover:text-red-500 cursor-pointer"
                                  title="Remove Member"
                                >
                                  <DeleteIcon style={{ fontSize: '11px' }} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        filteredChannelSubscribers.map(s => (
                          <div key={s._id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-7 h-7 rounded-xl bg-tg-bgDark flex items-center justify-center font-bold text-[10px] border border-tg-borderDark/80">
                                {s.profilePhoto ? (
                                  <img src={getFileUrl(s.profilePhoto)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{s.firstName?.[0]?.toUpperCase() || s.username[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <span className="font-semibold truncate">
                                {s.firstName || s.lastName ? `${s.firstName} ${s.lastName}` : `@${s.username}`}
                              </span>
                            </div>
                            {isChannelCreator && s._id !== user.id && (
                              <button
                                onClick={() => handleRemoveSubscriber(s._id)}
                                className="text-red-400 hover:text-red-500 cursor-pointer"
                                title="Remove Subscriber"
                              >
                                <DeleteIcon style={{ fontSize: '11px' }} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              <div className="text-[10px] font-bold text-tg-textMuted uppercase px-1 tracking-wider">
                Shared Documents
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {docsOnly.length > 0 ? (
                  docsOnly.map((file, fIdx) => (
                    <div
                      key={file._id || fIdx}
                      className="p-2.5 bg-tg-bgDark/35 border border-tg-borderDark rounded-xl flex items-center gap-3 shadow-sm hover:bg-tg-bgDark/50 transition"
                    >
                      <FolderOpenIcon className="text-tg-blue" fontSize="small" />
                      <div className="text-left overflow-hidden flex-grow">
                        <span className="text-[11px] font-bold text-tg-textDefault truncate block">{file.originalname}</span>
                        <span className="text-[9px] text-tg-textMuted">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.uploader ? (file.uploader.firstName || file.uploader.username) : 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(file._id, file.originalname)}
                        className="p-1 rounded-full bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition cursor-pointer flex-shrink-0"
                        title="Download file"
                      >
                        <DownloadIcon fontSize="small" style={{ fontSize: '14px' }} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-tg-textMuted block text-center py-6">No documents shared yet</span>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              <div className="text-[10px] font-bold text-tg-textMuted uppercase px-1 tracking-wider">
                Shared Images & Videos
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-[70vh] overflow-y-auto pr-1">
                {imagesOnly.length > 0 ? (
                  imagesOnly.map((file, fIdx) => (
                    <div
                      key={file._id || fIdx}
                      className="aspect-square bg-tg-bgDark rounded-xl overflow-hidden border border-tg-borderDark cursor-pointer relative group/gal shadow-sm"
                      onClick={() => window.open(getFileUrl(file.path), '_blank')}
                    >
                      <img src={getFileUrl(file.path)} alt="" className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownloadFile(file._id, file.originalname);
                        }}
                        className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/85 text-white rounded-full opacity-0 group-hover/gal:opacity-100 transition shadow"
                        title="Download"
                      >
                        <DownloadIcon fontSize="inherit" style={{ fontSize: '11px' }} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-tg-textMuted block text-center col-span-3 py-6">No media shared yet</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RightPanel;
