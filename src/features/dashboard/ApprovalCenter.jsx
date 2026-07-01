import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import {
  Check,
  Close,
  Assignment,
  History,
  BorderColor,
  Attachment,
  Add
} from '@mui/icons-material';

const ApprovalCenter = ({ user, contacts = [] }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New approval state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newApprover, setNewApprover] = useState('');
  
  // Action details
  const [activeApproval, setActiveApproval] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [showSignPad, setShowSignPad] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/approval');
      setApprovals(response.data);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApproval = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newApprover) return;

    try {
      const response = await api.post('/approval', {
        title: newTitle,
        description: newDesc,
        approverId: newApprover
      });
      setApprovals(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewApprover('');
    } catch (error) {
      alert(`Failed to request approval: ${error.message}`);
    }
  };

  const handleUpdateStatus = async (approvalId, status) => {
    try {
      const payload = { status };
      if (status === 'approved' && signatureText.trim()) {
        payload.signature = signatureText;
      }
      if (commentText.trim()) {
        payload.comments = commentText;
      }

      const response = await api.put(`/approval/${approvalId}`, payload);
      setApprovals(prev => prev.map(a => a._id === approvalId ? response.data : a));
      
      // Reset comments/signature states
      setCommentText('');
      setSignatureText('');
      setShowSignPad(false);
      
      // Update active panel if open
      if (activeApproval && activeApproval._id === approvalId) {
        setActiveApproval(response.data);
      }
    } catch (error) {
      alert(`Failed to update approval: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#0e1621] text-white flex h-full">
      {/* Left panel: list of requests */}
      <div className="w-1/2 border-r border-white/10 flex flex-col h-full">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h1 className="text-lg font-bold">Smart Approval Center</h1>
            <p className="text-[10px] text-white/50">Digital signatures & audit histories</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-tg-themeGreen hover:bg-tg-themeGreen/80 rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Add className="!text-sm" />
            Request Approval
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {loading && <div className="text-center text-xs text-white/30 p-8">Loading approvals...</div>}
          {approvals.length === 0 && !loading && (
            <div className="text-center text-xs text-white/30 p-8">No approval workflows found.</div>
          )}
          {approvals.map(appr => (
            <div
              key={appr._id}
              onClick={() => setActiveApproval(appr)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeApproval && activeApproval._id === appr._id
                  ? 'bg-white/10 border-tg-themeGreen'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold">{appr.title}</span>
                <span className={`text-[9px] font-semibold font-mono px-2 py-0.5 rounded uppercase ${
                  appr.status === 'approved' ? 'bg-tg-themeGreen/20 text-tg-themeGreen' :
                  appr.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                  appr.status === 'returned' ? 'bg-tg-themeAmber/20 text-tg-themeAmber' :
                  'bg-white/10 text-white/50'
                }`}>
                  {appr.status}
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-1 line-clamp-1">{appr.description}</p>
              
              <div className="flex justify-between items-center text-[9px] text-white/30 mt-3 pt-2 border-t border-white/5">
                <span>Requested by: @{appr.requester?.username}</span>
                <span>Approver: @{appr.approver?.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: detail check & actions */}
      <div className="w-1/2 flex flex-col h-full bg-white/5">
        {activeApproval ? (
          <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold">{activeApproval.title}</h2>
                <span className="text-[10px] bg-white/10 border border-white/15 px-2.5 py-1 rounded font-mono">
                  ID: {activeApproval._id.substring(18)}
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed bg-white/5 p-3 rounded-xl">
                {activeApproval.description}
              </p>
            </div>

            {/* Approver actions if user is the assigned approver and status is pending */}
            {activeApproval.status === 'pending' && activeApproval.approver?._id === user.id && (
              <div className="p-4 rounded-xl bg-tg-themeGreen/10 border border-tg-themeGreen/20 space-y-4">
                <span className="text-xs font-semibold text-tg-themeGreen flex items-center gap-1.5">
                  <BorderColor className="!text-sm" />
                  Your Approval Required
                </span>

                <div className="space-y-1">
                  <label className="text-[10px] text-white/40">Comments (Optional)</label>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-tg-bgSidebarDark border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-tg-themeGreen"
                    placeholder="Enter approval details or feedback..."
                  />
                </div>

                {/* Digital Signature */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="sign"
                      checked={showSignPad}
                      onChange={(e) => setShowSignPad(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="sign" className="text-[10px] text-white/60 cursor-pointer select-none">
                      Append digital validation signature
                    </label>
                  </div>
                  {showSignPad && (
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Type your full name to generate digital seal..."
                      className="w-full bg-tg-bgSidebarDark border border-white/10 rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-tg-themeGreen"
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(activeApproval._id, 'approved')}
                    className="flex-1 py-2 bg-tg-themeGreen hover:bg-tg-themeGreen/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Check className="!text-sm" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeApproval._id, 'rejected')}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Close className="!text-sm" />
                    Reject Request
                  </button>
                </div>
              </div>
            )}

            {/* Digital signature display */}
            {activeApproval.signature && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] text-white/40">Secure Digital Signature Seal:</span>
                <div className="p-3 bg-white/5 border border-dashed border-white/10 rounded text-center text-xs font-mono tracking-widest text-tg-themeGreen">
                  ✓ SECURE SEAL: {activeApproval.signature.toUpperCase()}
                </div>
              </div>
            )}

            {/* Audit History Logs */}
            <div className="space-y-3">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <History className="!text-base text-tg-themeBlue" />
                Audit Trail Logs
              </span>
              <div className="space-y-2">
                {activeApproval.history?.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 text-[10px] text-white/50 bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="font-mono text-tg-themeBlue">[{log.action}]</span>
                    <span className="flex-1">Performed on {new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments log */}
            {activeApproval.comments && activeApproval.comments.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold">Discussion Comments</span>
                <div className="space-y-2.5">
                  {activeApproval.comments.map(c => (
                    <div key={c._id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                      <div className="flex justify-between text-[9px] text-white/40 font-semibold">
                        <span>@{c.user?.username}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-white/80">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-white/30 text-xs gap-2">
            <Assignment className="!text-3xl text-white/10" />
            Select an approval request to view audits & actions
          </div>
        )}
      </div>

      {/* Request Approval Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center">
          <form onSubmit={handleCreateApproval} className="w-full max-w-md bg-tg-bgSidebarDark border border-white/10 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold">Request Approval</h2>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Request Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeGreen"
                placeholder="e.g. Budget allocation, Invoice release"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Request Details</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeGreen h-20"
                placeholder="Describe your request..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Designated Approver</label>
              <select
                required
                value={newApprover}
                onChange={(e) => setNewApprover(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeGreen"
              >
                <option value="">Select an Approver</option>
                {contacts.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName} (@{c.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-tg-themeGreen hover:bg-tg-themeGreen/80 rounded-xl text-xs font-semibold text-white"
              >
                Send Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ApprovalCenter;
