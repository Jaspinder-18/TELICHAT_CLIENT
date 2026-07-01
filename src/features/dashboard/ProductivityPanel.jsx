import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import {
  AccessTime,
  ChatBubbleOutline,
  DoneAll,
  Groups,
  QueryStats,
  AutoAwesome,
  Share,
  Leaderboard
} from '@mui/icons-material';

const ProductivityPanel = ({ user }) => {
  const [metrics, setMetrics] = useState([]);
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState('General');
  const [deptStats, setDeptStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/productivity');
      setMetrics(response.data.metrics || []);
      setSuggestions(response.data.suggestions || 'Keep up the consistent work!');
    } catch (e) {
      console.error('Failed to load metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDeptStats = async (dept) => {
    setSelectedDept(dept);
    try {
      const res = await api.get(`/productivity/department?department=${dept}`);
      setDeptStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Get active metric
  const activeMetric = metrics[0] || {
    messagesSent: 0,
    tasksCompleted: 0,
    focusTimeMinutes: 0,
    responseTimeMinutes: 0,
    communicationScore: 100,
    meetingsAttended: 0,
    filesShared: 0
  };

  const statCards = [
    { title: 'Focus Time', value: `${activeMetric.focusTimeMinutes} mins`, icon: <AccessTime className="text-tg-themeBlue" />, desc: 'Time spent in deep focus' },
    { title: 'Tasks Completed', value: activeMetric.tasksCompleted, icon: <DoneAll className="text-tg-themeGreen" />, desc: 'Sprint items finalized' },
    { title: 'Messages Sent', value: activeMetric.messagesSent, icon: <ChatBubbleOutline className="text-tg-themeAmber" />, desc: 'Communication volume' },
    { title: 'Meetings Attended', value: activeMetric.meetingsAttended, icon: <Groups className="text-tg-themePurple" />, desc: 'Active sync sessions' },
    { title: 'Files Shared', value: activeMetric.filesShared, icon: <Share className="text-tg-themeBlue" />, desc: 'Collaborative assets' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0e1621] text-white space-y-6 scrollbar-thin">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Productivity Dashboard</h1>
        <p className="text-xs text-white/50">Personal focus scores & management insights</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">{card.title}</span>
              {card.icon}
            </div>
            <div>
              <span className="text-xl font-bold font-mono">{card.value}</span>
              <p className="text-[9px] text-white/30 mt-1">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal AI Coach tips */}
        <div className="p-6 bg-gradient-to-br from-tg-themeBlue/10 to-transparent border border-tg-themeBlue/20 rounded-2xl space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 text-tg-themeBlue">
            <AutoAwesome className="!text-base" />
            AI Productivity Coach suggestions
          </h3>
          {loading ? (
            <div className="text-xs text-white/30 animate-pulse">Running diagnostic reports...</div>
          ) : (
            <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
              {suggestions}
            </p>
          )}
        </div>

        {/* Manager/Department Stats aggregator */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Leaderboard className="!text-base text-tg-themePurple" />
            Departmental Metrics
          </h3>
          <div className="flex gap-2">
            {['General', 'Engineering', 'Marketing', 'Support'].map(dept => (
              <button
                key={dept}
                onClick={() => handleFetchDeptStats(dept)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  selectedDept === dept ? 'bg-tg-themePurple text-white' : 'bg-white/5 hover:bg-white/10 text-white/60'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {deptStats ? (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block">Avg Comm Score</span>
                <span className="text-base font-bold font-mono text-tg-themeGreen">
                  {Math.round(deptStats.avgCommunicationScore || 100)} / 100
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block">Tasks Completed</span>
                <span className="text-base font-bold font-mono text-tg-themeBlue">
                  {deptStats.totalTasksCompleted || 0}
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block">Total Messages</span>
                <span className="text-base font-bold font-mono text-tg-themeAmber">
                  {deptStats.totalMessagesSent || 0}
                </span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/40 block">Avg Response Latency</span>
                <span className="text-base font-bold font-mono text-tg-themePurple">
                  {Math.round(deptStats.avgResponseTime || 15)} mins
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-white/30 py-8">
              Click a department to load analytics data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductivityPanel;
