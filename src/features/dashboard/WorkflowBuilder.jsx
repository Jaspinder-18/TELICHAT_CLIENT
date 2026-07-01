import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import {
  PlayCircleOutline,
  Save,
  Add,
  Delete,
  FlashOn,
  Settings,
  HelpOutline
} from '@mui/icons-material';

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [name, setName] = useState('New Automation Flow');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await api.get('/workflow');
      setWorkflows(res.data);
      if (res.data.length > 0) {
        selectWorkflow(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
    }
  };

  const selectWorkflow = (wf) => {
    setActiveWorkflow(wf);
    setName(wf.name);
    setNodes(wf.nodes || []);
    setEdges(wf.edges || []);
  };

  const handleAddNewNode = (type, actionName) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type, // 'trigger' | 'action'
      data: {
        title: actionName,
        recipient: '',
        message: '',
        details: ''
      },
      position: { x: 50 + nodes.length * 40, y: 100 + nodes.length * 60 }
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleUpdateNodeData = (nodeId, key, val) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: { ...n.data, [key]: val }
        };
      }
      return n;
    }));
  };

  const handleRemoveNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  const handleSaveWorkflow = async () => {
    if (!name.trim()) return;
    try {
      if (activeWorkflow) {
        const res = await api.put(`/workflow/${activeWorkflow._id}`, {
          name,
          nodes,
          edges
        });
        setWorkflows(prev => prev.map(w => w._id === activeWorkflow._id ? res.data : w));
        alert('Workflow updated successfully!');
      } else {
        const res = await api.post('/workflow', {
          name,
          nodes,
          edges
        });
        setWorkflows(prev => [res.data, ...prev]);
        setActiveWorkflow(res.data);
        alert('Workflow created successfully!');
      }
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    }
  };

  const handleStartNew = () => {
    setActiveWorkflow(null);
    setName('New Automation Flow');
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#0e1621] text-white flex h-full">
      {/* Left panel: Available automation blocks & flows list */}
      <div className="w-[300px] border-r border-white/10 flex flex-col h-full bg-[#17212b]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider">Automations List</h2>
          <button
            onClick={handleStartNew}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold"
          >
            New
          </button>
        </div>

        {/* Existing Flows */}
        <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto border-b border-white/10 scrollbar-thin">
          {workflows.map(wf => (
            <div
              key={wf._id}
              onClick={() => selectWorkflow(wf)}
              className={`p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeWorkflow && activeWorkflow._id === wf._id ? 'bg-tg-themeBlue text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {wf.name}
            </div>
          ))}
        </div>

        {/* Nodes library picker */}
        <div className="flex-1 p-4 space-y-5 overflow-y-auto scrollbar-thin">
          <span className="text-[10px] uppercase font-bold text-white/40 block">Drag/Click to Add Blocks</span>

          {/* Trigger Blocks */}
          <div className="space-y-2">
            <span className="text-[10px] text-tg-themeAmber font-semibold block">Triggers</span>
            <button
              onClick={() => handleAddNewNode('trigger', 'On Invoice Uploaded')}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-dashed border-white/10 text-left text-xs font-medium flex items-center gap-2 group transition-all"
            >
              <FlashOn className="text-tg-themeAmber" />
              On Invoice Uploaded
            </button>
            <button
              onClick={() => handleAddNewNode('trigger', 'On Keywords Mentioned')}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-dashed border-white/10 text-left text-xs font-medium flex items-center gap-2 group transition-all"
            >
              <FlashOn className="text-tg-themeAmber" />
              On Keywords (e.g. urgent)
            </button>
          </div>

          {/* Action Blocks */}
          <div className="space-y-2">
            <span className="text-[10px] text-tg-themeBlue font-semibold block">Actions</span>
            <button
              onClick={() => handleAddNewNode('action', 'Notify Accounts Group')}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-dashed border-white/10 text-left text-xs font-medium flex items-center gap-2 group transition-all"
            >
              <Settings className="text-tg-themeBlue" />
              Notify Accounts Group
            </button>
            <button
              onClick={() => handleAddNewNode('action', 'Create Smart Approval')}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-dashed border-white/10 text-left text-xs font-medium flex items-center gap-2 group transition-all"
            >
              <Settings className="text-tg-themeGreen" />
              Create Smart Approval
            </button>
            <button
              onClick={() => handleAddNewNode('action', 'Send Email Alerts')}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-dashed border-white/10 text-left text-xs font-medium flex items-center gap-2 group transition-all"
            >
              <Settings className="text-tg-themePurple" />
              Send Email Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Main Builder Workspace canvas */}
      <div className="flex-1 flex flex-col h-full bg-[#0e1621] relative overflow-hidden">
        {/* Top bar controls */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between z-10">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-tg-themeBlue outline-none text-sm font-semibold px-2 py-1 transition-all"
          />
          <button
            onClick={handleSaveWorkflow}
            className="flex items-center gap-1.5 px-4 py-2 bg-tg-themeBlue hover:bg-tg-themeBlue/80 rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Save className="!text-sm" />
            Save Flow
          </button>
        </div>

        {/* Visual Canvas screen */}
        <div className="flex-1 relative overflow-auto p-8 grid-background bg-grid-pattern">
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 text-xs gap-2">
              <FlashOn className="!text-3xl text-white/10" />
              Click trigger or action blocks in the library to start building automation.
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-lg mx-auto">
              {nodes.map((node, index) => (
                <div key={node.id} className="relative flex flex-col items-center">
                  
                  {/* Node box panel */}
                  <div className="w-full bg-[#17212b] border border-white/10 rounded-2xl p-4 shadow-xl relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded font-mono ${
                        node.type === 'trigger' ? 'bg-tg-themeAmber/25 text-tg-themeAmber' : 'bg-tg-themeBlue/25 text-tg-themeBlue'
                      }`}>
                        {node.type}
                      </span>
                      <button
                        onClick={() => handleRemoveNode(node.id)}
                        className="text-white/40 hover:text-red-400 p-0.5 rounded transition"
                      >
                        <Delete className="!text-sm" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold mb-2">{node.data.title}</h4>

                    {/* Inputs panel */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={node.data.recipient || ''}
                          onChange={(e) => handleUpdateNodeData(node.id, 'recipient', e.target.value)}
                          placeholder="Recipient Target"
                          className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-tg-themeBlue"
                        />
                        <input
                          type="text"
                          value={node.data.message || ''}
                          onChange={(e) => handleUpdateNodeData(node.id, 'message', e.target.value)}
                          placeholder="Parameters / Notes"
                          className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-tg-themeBlue"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual connector line indicator */}
                  {index < nodes.length - 1 && (
                    <div className="w-0.5 h-6 bg-dashed border-l border-dashed border-white/20 my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
