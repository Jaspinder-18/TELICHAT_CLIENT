import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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

  // Derive shared files from Redux messages list locally for real-time reactivity and accuracy
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

  return (
    <div className="w-full sm:w-[300px] h-full bg-tg-bgSidebarDark border-l border-tg-borderDark flex flex-col z-30 flex-shrink-0 animate-slide-in shadow-2xl">
      {/* Header */}
      <div className="h-[60px] border-b border-tg-borderDark flex items-center justify-between px-4">
        <h4 className="text-xs font-bold text-tg-textDefault uppercase tracking-wider">Info Details</h4>
        <button
          onClick={() => dispatch(setRightSidebarOpen(false))}
          className="p-1 rounded-lg text-tg-textMuted hover:bg-tg-bgDark hover:text-tg-textDefault transition"
        >
          <CloseIcon fontSize="small" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-tg-borderDark text-[10px] uppercase font-bold text-center">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 transition border-b-2 ${activeTab === 'profile' ? 'border-tg-blue text-tg-blue' : 'border-transparent text-tg-textMuted hover:text-tg-textDefault'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-3 transition border-b-2 ${activeTab === 'files' ? 'border-tg-blue text-tg-blue' : 'border-transparent text-tg-textMuted hover:text-tg-textDefault'}`}
        >
          Files ({docsOnly.length})
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-3 transition border-b-2 ${activeTab === 'media' ? 'border-tg-blue text-tg-blue' : 'border-transparent text-tg-textMuted hover:text-tg-textDefault'}`}
        >
          Media ({imagesOnly.length})
        </button>
      </div>

      {/* Viewport content */}
      <div className="flex-grow overflow-y-auto p-5 text-left">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Display */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-tg-blue/10 border border-tg-blue/20 overflow-hidden flex items-center justify-center text-tg-blue font-bold text-2xl mb-3 shadow-md">
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
              <p className="text-[10px] text-tg-textMuted mt-1">
                {activeChatType === 'user' ? `@${activeChat.username}` : 'Corporate Resource'}
              </p>
            </div>

            {/* Profile fields list / Group details list */}
            {activeChatType === 'user' ? (
              <div className="space-y-4 pt-4 border-t border-tg-borderDark">
                <div className="flex items-start gap-3">
                  <PermIdentityIcon className="text-tg-blue mt-0.5" fontSize="small" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Employee ID</span>
                    <span className="text-xs text-tg-textDefault">{activeChat.employeeId || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CorporateFareIcon className="text-tg-blue mt-0.5" fontSize="small" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Department</span>
                    <span className="text-xs text-tg-textDefault">{activeChat.department || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PermContactCalendarIcon className="text-tg-blue mt-0.5" fontSize="small" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-tg-textMuted block">Email Address</span>
                    <span className="text-xs text-tg-textDefault">{activeChat.email}</span>
                  </div>
                </div>
              </div>
            ) : activeChatType === 'channel' ? (
              // Channel details
              <div className="space-y-4 pt-4 border-t border-tg-borderDark text-xs text-tg-textMuted leading-relaxed">
                <p><strong className="text-tg-textDefault">Description:</strong> {activeChat.description || 'No description provided.'}</p>
                <p><strong className="text-tg-textDefault">Visibility:</strong> {activeChat.type}</p>
                
                <p>
                  <strong className="text-tg-textDefault font-bold">Channel ID:</strong>
                  <div className="flex items-center gap-1.5 mt-1 bg-gray-900/30 p-1.5 rounded-lg border border-tg-borderDark">
                    <span className="text-[10px] truncate select-all flex-grow font-mono text-tg-blue">
                      {activeChat._id}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeChat._id);
                        dispatch(setAlert({ message: 'Channel ID copied!', severity: 'success' }));
                      }}
                      className="px-1.5 py-0.5 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue text-[9px] font-bold rounded"
                    >
                      Copy
                    </button>
                  </div>
                </p>

                <p>
                  <strong className="text-tg-textDefault font-bold">Invite Link:</strong>
                  <div className="flex items-center gap-1.5 mt-1 bg-gray-900/30 p-1.5 rounded-lg border border-tg-borderDark">
                    <span className="text-[10px] truncate select-all flex-grow font-mono text-tg-blue">
                      {window.location.origin}/join/channel/{activeChat.inviteToken}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/join/channel/${activeChat.inviteToken}`);
                        dispatch(setAlert({ message: 'Channel link copied!', severity: 'success' }));
                      }}
                      className="px-1.5 py-0.5 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue text-[9px] font-bold rounded"
                    >
                      Copy
                    </button>
                  </div>
                </p>

                {/* Subscribers section */}
                <div className="pt-4 border-t border-tg-borderDark space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold text-tg-textMuted tracking-wider">
                      Subscribers ({activeChat.subscribers?.length || 0})
                    </span>
                    {((activeChat.creator?._id || activeChat.creator) === user?.id || user?.role === 'admin') && (
                      <button
                        onClick={() => setShowAddMemberPanel(!showAddMemberPanel)}
                        className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition flex items-center justify-center"
                        title="Add Subscriber"
                      >
                        <PersonAddIcon fontSize="inherit" style={{ fontSize: '14px' }} />
                      </button>
                    )}
                  </div>

                  {/* Add Subscriber Panel */}
                  {showAddMemberPanel && (
                    <div className="bg-tg-bgDark border border-tg-borderDark p-2.5 rounded-xl space-y-2">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1.5 text-gray-500" fontSize="inherit" style={{ fontSize: '12px' }} />
                        <input
                          type="text"
                          placeholder="Search contacts to add..."
                          value={contactSearchQuery}
                          onChange={(e) => setContactSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-3 py-1 bg-tg-bgDark border border-tg-borderDark rounded-lg focus:outline-none text-[10px] text-tg-textDefault placeholder-tg-textMuted"
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                        {contacts
                          .filter(c => {
                            const isAlreadySub = activeChat.subscribers?.some(s => (s._id || s) === c._id);
                            if (isAlreadySub) return false;
                            const fullName = `${c.firstName || ''} ${c.lastName || ''} ${c.username}`.toLowerCase();
                            return fullName.includes(contactSearchQuery.toLowerCase());
                          })
                          .map(c => (
                            <div key={c._id} className="flex items-center justify-between gap-2 p-1 hover:bg-tg-bgDark rounded-lg">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-5 h-5 rounded bg-tg-bgDark flex-shrink-0 flex items-center justify-center text-[9px] text-tg-textDefault font-bold border border-tg-borderDark">
                                  {c.profilePhoto ? (
                                    <img src={getFileUrl(c.profilePhoto)} alt="" className="w-full h-full object-cover rounded" />
                                  ) : (
                                    <span>{(c.firstName || c.username)[0].toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-tg-textDefault truncate">
                                  {c.firstName || c.lastName ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : `@${c.username}`}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddSubscriber(c._id)}
                                className="px-1.5 py-0.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-[8px] font-bold rounded"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        {contacts.filter(c => {
                          const isAlreadySub = activeChat.subscribers?.some(s => (s._id || s) === c._id);
                          if (isAlreadySub) return false;
                          const fullName = `${c.firstName || ''} ${c.lastName || ''} ${c.username}`.toLowerCase();
                          return fullName.includes(contactSearchQuery.toLowerCase());
                        }).length === 0 && (
                          <p className="text-[9px] text-tg-textMuted text-center py-2">No contacts to add</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subscribers List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeChat.subscribers
                      ?.filter(s => {
                        const nameStr = `${s.firstName || ''} ${s.lastName || ''} ${s.username}`.toLowerCase();
                        return nameStr.includes(memberSearchQuery.toLowerCase());
                      })
                      .map(s => {
                        const isTargetSelf = s._id === user.id;
                        const isCreator = (activeChat.creator?._id || activeChat.creator) === s._id;
                        const isCallerCreator = (activeChat.creator?._id || activeChat.creator) === user?.id || user?.role === 'admin';
                        const canRemove = isCallerCreator && !isCreator && !isTargetSelf;

                        return (
                          <div key={s._id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-tg-bgDark rounded-xl border border-transparent hover:border-tg-borderDark">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="relative flex-shrink-0">
                                <div className="w-7 h-7 rounded-lg bg-tg-bgDark flex items-center justify-center text-[10px] text-tg-textDefault border border-tg-borderDark">
                                  {s.profilePhoto ? (
                                    <img src={getFileUrl(s.profilePhoto)} alt="" className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    <span>{(s.firstName || s.username)[0].toUpperCase()}</span>
                                  )}
                                </div>
                                {s.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-tg-bgSidebarDark rounded-full" />
                                )}
                              </div>
                              <div className="text-left overflow-hidden">
                                <span className="text-[11px] font-semibold text-tg-textDefault block truncate leading-tight">
                                  {s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : `@${s.username}`}
                                </span>
                                <span className="text-[8px] text-tg-textMuted block truncate">
                                  {isCreator ? 'Owner' : 'Subscriber'}
                                </span>
                              </div>
                            </div>
                            {canRemove && (
                              <button
                                onClick={() => handleRemoveSubscriber(s._id)}
                                className="p-1 rounded text-red-400 hover:bg-red-500/10 hover:text-red-500 transition"
                                title="Remove subscriber"
                              >
                                <DeleteIcon fontSize="inherit" style={{ fontSize: '13px' }} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              // Group details
              <div className="space-y-6 pt-4 border-t border-tg-borderDark">
                {isEditingGroup ? (
                  <form onSubmit={handleSaveGroupDetails} className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-tg-bgDark border border-tg-borderDark overflow-hidden flex items-center justify-center relative shadow-inner">
                        {groupAvatarPreview ? (
                          <img src={getFileUrl(groupAvatarPreview)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-tg-blue">{groupName[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <label className="text-[10px] text-tg-blue hover:underline cursor-pointer mt-1.5 font-semibold">
                        Change Avatar
                        <input 
                          type="file" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setGroupAvatarFile(e.target.files[0]);
                              setGroupAvatarPreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }} 
                          className="hidden" 
                          accept="image/*" 
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Group Name</label>
                      <input
                        type="text"
                        required
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Description</label>
                      <textarea
                        value={groupDesc}
                        onChange={(e) => setGroupDesc(e.target.value)}
                        className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault h-16 focus:outline-none focus:border-tg-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase text-tg-textMuted font-bold mb-1 tracking-wider">Type</label>
                      <select
                        value={groupType}
                        onChange={(e) => setGroupType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-tg-bgDark border border-tg-borderDark rounded-xl text-xs text-tg-textDefault focus:outline-none focus:border-tg-blue"
                      >
                        <option value="private">Private (Invite Only)</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-grow py-2 bg-tg-blue hover:bg-tg-darkBlue text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1"
                      >
                        <SaveIcon fontSize="inherit" style={{ fontSize: '13px' }} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingGroup(false)}
                        className="flex-grow py-2 bg-tg-bgDark hover:bg-tg-bgDark/80 border border-tg-borderDark text-tg-textDefault text-xs font-semibold rounded-xl transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2.5 text-xs text-tg-textMuted leading-relaxed">
                      <p><strong className="text-tg-textDefault">Description:</strong> {activeChat.description || 'No description provided.'}</p>
                      <p><strong className="text-tg-textDefault">Visibility:</strong> {activeChat.type}</p>
                      <p><strong className="text-tg-textDefault">Owner:</strong> @{activeChat.owner?.username || 'System'}</p>
                      <p>
                        <strong className="text-tg-textDefault font-bold">Group ID:</strong>
                        <div className="flex items-center gap-1.5 mt-1 bg-gray-900/30 p-1.5 rounded-lg border border-tg-borderDark">
                          <span className="text-[10px] truncate select-all flex-grow font-mono text-tg-blue">
                            {activeChat._id}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeChat._id);
                              dispatch(setAlert({ message: 'Group ID copied!', severity: 'success' }));
                            }}
                            className="px-1.5 py-0.5 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue text-[9px] font-bold rounded"
                          >
                            Copy
                          </button>
                        </div>
                      </p>

                      <p>
                        <strong className="text-tg-textDefault font-bold">Invite Link:</strong>
                        <div className="flex items-center gap-1.5 mt-1 bg-gray-900/30 p-1.5 rounded-lg border border-tg-borderDark">
                          <span className="text-[10px] truncate select-all flex-grow font-mono text-tg-blue">
                            {window.location.origin}/join/group/{activeChat.inviteToken}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/join/group/${activeChat.inviteToken}`);
                              dispatch(setAlert({ message: 'Group link copied!', severity: 'success' }));
                            }}
                            className="px-1.5 py-0.5 bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue text-[9px] font-bold rounded"
                          >
                            Copy
                          </button>
                        </div>
                      </p>
                      
                      {/* Announcement toggle */}
                      {(() => {
                        const currentMember = activeChat.members?.find(m => (m.user?._id || m.user)?.toString() === user?.id?.toString());
                        const userRole = currentMember ? currentMember.role : null;
                        const isGroupAdminOrOwner = userRole === 'owner' || userRole === 'admin' || user?.role === 'admin';
                        return isGroupAdminOrOwner && (
                          <div className="flex items-center justify-between pt-2.5 border-t border-tg-borderDark">
                            <span className="text-[9px] uppercase font-bold text-tg-textMuted">Announcement Mode</span>
                            <button
                              onClick={handleToggleAnnouncementMode}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${activeChat.announcementMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-tg-bgDark text-tg-textMuted border-tg-borderDark'}`}
                            >
                              {activeChat.announcementMode ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const currentMember = activeChat.members?.find(m => (m.user?._id || m.user)?.toString() === user?.id?.toString());
                      const userRole = currentMember ? currentMember.role : null;
                      const isGroupAdminOrOwner = userRole === 'owner' || userRole === 'admin' || user?.role === 'admin';
                      return isGroupAdminOrOwner && (
                        <button
                          onClick={() => {
                            setGroupName(activeChat.name || '');
                            setGroupDesc(activeChat.description || '');
                            setGroupType(activeChat.type || 'private');
                            setGroupAvatarPreview(activeChat.avatar || '');
                            setIsEditingGroup(true);
                          }}
                          className="w-full py-2 bg-tg-bgDark hover:bg-tg-bgDark border border-tg-borderDark text-tg-textDefault text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <EditIcon fontSize="inherit" style={{ fontSize: '13px' }} /> Edit Group Details
                        </button>
                      );
                    })()}
                  </div>
                )}

                {/* Group Members List section */}
                <div className="pt-4 border-t border-tg-borderDark space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold text-tg-textMuted tracking-wider">
                      Members ({activeChat.members?.length || 0})
                    </span>
                    {(() => {
                      const currentMember = activeChat.members?.find(m => (m.user?._id || m.user)?.toString() === user?.id?.toString());
                      const userRole = currentMember ? currentMember.role : null;
                      const isGroupAdminOrOwner = userRole === 'owner' || userRole === 'admin' || user?.role === 'admin';
                      return isGroupAdminOrOwner && (
                        <button
                          onClick={() => setShowAddMemberPanel(!showAddMemberPanel)}
                          className="p-1 rounded bg-tg-blue/10 hover:bg-tg-blue/20 text-tg-blue transition flex items-center justify-center"
                          title="Add Member"
                        >
                          <PersonAddIcon fontSize="inherit" style={{ fontSize: '14px' }} />
                        </button>
                      );
                    })()}
                  </div>

                  {/* Add Member Panel */}
                  {showAddMemberPanel && (
                    <div className="bg-tg-bgDark border border-tg-borderDark p-2.5 rounded-xl space-y-2">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1.5 text-gray-500" fontSize="inherit" style={{ fontSize: '12px' }} />
                        <input
                          type="text"
                          placeholder="Search contacts to add..."
                          value={contactSearchQuery}
                          onChange={(e) => setContactSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-3 py-1 bg-tg-bgDark border border-tg-borderDark rounded-lg focus:outline-none text-[10px] text-tg-textDefault placeholder-tg-textMuted"
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                        {contacts
                          .filter(c => {
                            const isAlreadyMember = activeChat.members?.some(m => (m.user?._id || m.user) === c._id);
                            if (isAlreadyMember) return false;
                            
                            const fullName = `${c.firstName || ''} ${c.lastName || ''} ${c.username}`.toLowerCase();
                            return fullName.includes(contactSearchQuery.toLowerCase());
                          })
                          .map(c => (
                            <div key={c._id} className="flex items-center justify-between gap-2 p-1 hover:bg-tg-bgDark rounded-lg">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-5 h-5 rounded bg-tg-bgDark flex-shrink-0 flex items-center justify-center text-[9px] text-tg-textDefault font-bold border border-tg-borderDark">
                                  {c.profilePhoto ? (
                                    <img src={getFileUrl(c.profilePhoto)} alt="" className="w-full h-full object-cover rounded" />
                                  ) : (
                                    <span>{(c.firstName || c.username)[0].toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-tg-textDefault truncate">
                                  {c.firstName || c.lastName ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : `@${c.username}`}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddMember(c._id)}
                                className="px-1.5 py-0.5 bg-tg-blue hover:bg-tg-darkBlue text-white text-[8px] font-bold rounded"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        {contacts.filter(c => {
                          const isAlreadyMember = activeChat.members?.some(m => (m.user?._id || m.user) === c._id);
                          if (isAlreadyMember) return false;
                          const fullName = `${c.firstName || ''} ${c.lastName || ''} ${c.username}`.toLowerCase();
                          return fullName.includes(contactSearchQuery.toLowerCase());
                        }).length === 0 && (
                          <p className="text-[9px] text-tg-textMuted text-center py-2">No contacts to add</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members search bar */}
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2 text-gray-500" fontSize="inherit" />
                    <input
                      type="text"
                      placeholder="Search group members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-tg-bgDark border border-tg-borderDark rounded-lg focus:outline-none text-[10px] text-tg-textDefault placeholder-tg-textMuted"
                    />
                  </div>

                  {/* Members List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeChat.members
                      ?.filter(m => {
                        const u = m.user;
                        if (!u) return false;
                        const nameStr = `${u.firstName || ''} ${u.lastName || ''} ${u.username}`.toLowerCase();
                        return nameStr.includes(memberSearchQuery.toLowerCase());
                      })
                      .map(m => {
                        const u = m.user;
                        const isTargetSelf = u._id === user.id;
                        const isTargetOwner = m.role === 'owner';
                        
                        const currentMember = activeChat.members?.find(mem => (mem.user?._id || mem.user)?.toString() === user?.id?.toString());
                        const userRole = currentMember ? currentMember.role : null;
                        const isGroupAdminOrOwner = userRole === 'owner' || userRole === 'admin' || user?.role === 'admin';
                        
                        const canRemove = isGroupAdminOrOwner && !isTargetOwner && !isTargetSelf;

                        return (
                          <div key={u._id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-tg-bgDark rounded-xl border border-transparent hover:border-tg-borderDark">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="relative flex-shrink-0">
                                <div className="w-7 h-7 rounded-lg bg-tg-bgDark flex items-center justify-center text-[10px] text-tg-textDefault border border-tg-borderDark">
                                  {u.profilePhoto ? (
                                    <img src={getFileUrl(u.profilePhoto)} alt="" className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    <span>{(u.firstName || u.username)[0].toUpperCase()}</span>
                                  )}
                                </div>
                                {u.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-tg-bgSidebarDark rounded-full" />
                                )}
                              </div>
                              <div className="text-left overflow-hidden">
                                <span className="text-[11px] font-semibold text-tg-textDefault block truncate leading-tight">
                                  {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : `@${u.username}`}
                                </span>
                                <span className="text-[8px] text-tg-textMuted block truncate">
                                  {u.department || 'Staff'} • {m.role}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Role changer dropdown if owner/admin */}
                              {isGroupAdminOrOwner && !isTargetOwner && !isTargetSelf && (userRole === 'owner' || user?.role === 'admin') && (
                                <select
                                  value={m.role}
                                  onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                                  className="bg-tg-bgDark border border-tg-borderDark text-[8px] text-tg-textDefault rounded px-1 py-0.5 focus:outline-none focus:border-tg-blue"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                              )}
                              {canRemove && (
                                <button
                                  onClick={() => handleRemoveMember(u._id)}
                                  className="p-1 rounded text-red-400 hover:bg-red-500/10 hover:text-red-500 transition"
                                  title="Remove member"
                                >
                                  <DeleteIcon fontSize="inherit" style={{ fontSize: '13px' }} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-3">
            {docsOnly.length === 0 ? (
              <p className="text-[10px] text-tg-textMuted text-center py-10">No documents shared yet.</p>
            ) : (
              docsOnly.map(f => (
                <a
                  key={f._id}
                  href={`${api.defaults.baseURL}/file/download/${f._id}`}
                  className="flex items-center gap-3 p-2 bg-tg-bgDark border border-tg-borderDark hover:bg-tg-bgDark rounded-xl transition cursor-pointer overflow-hidden"
                >
                  <FolderOpenIcon className="text-tg-blue flex-shrink-0" fontSize="small" />
                  <div className="overflow-hidden">
                    <span className="text-xs font-semibold text-tg-textDefault block truncate">{f.originalname}</span>
                    <span className="text-[9px] text-tg-textMuted">
                      {(f.size / 1024 / 1024).toFixed(2)} MB • v{f.version}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="grid grid-cols-3 gap-2">
            {imagesOnly.length === 0 ? (
              <p className="text-[10px] text-tg-textMuted text-center py-10 col-span-3">No images shared yet.</p>
            ) : (
              imagesOnly.map(f => (
                <a
                  key={f._id}
                  href={getFileUrl(f.path)}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square bg-tg-bgDark rounded-lg overflow-hidden border border-tg-borderDark hover:scale-105 transition"
                >
                  <img src={getFileUrl(f.path)} alt="" className="w-full h-full object-cover" />
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
