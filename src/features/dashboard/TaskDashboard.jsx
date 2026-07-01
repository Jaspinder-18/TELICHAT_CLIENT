import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import {
  Add,
  Warning,
  CheckCircle,
  TrendingDown,
  AutoGraph,
  CalendarToday,
  PlayArrow,
  AssignmentTurnedIn
} from '@mui/icons-material';

const TaskDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/task');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictDelays = async () => {
    setLoadingAi(true);
    setAiReport('');
    try {
      const response = await api.get('/task/predict-delays');
      setAiReport(response.data.analysis);
    } catch (error) {
      setAiReport(`AI delay analysis failed: ${error.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await api.post('/task', {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        dueDate: newDueDate || null
      });
      setTasks(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewDueDate('');
    } catch (error) {
      alert(`Failed to create task: ${error.message}`);
    }
  };

  const handleMoveStatus = async (taskId, currentStatus) => {
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];
    const progressMap = { 'todo': 0, 'in-progress': 40, 'review': 80, 'done': 100 };

    try {
      const response = await api.put(`/task/${taskId}`, {
        status: nextStatus,
        progress: progressMap[nextStatus]
      });

      setTasks(prev => prev.map(t => t._id === taskId ? response.data : t));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const columns = [
    { key: 'todo', title: 'To Do', border: 'border-t-tg-themeBlue' },
    { key: 'in-progress', title: 'In Progress', border: 'border-t-tg-themeAmber' },
    { key: 'review', title: 'Under Review', border: 'border-t-tg-themePurple' },
    { key: 'done', title: 'Completed', border: 'border-t-tg-themeGreen' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 text-white bg-[#0e1621] space-y-6 scrollbar-thin">
      
      {/* Title Header area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Task Manager</h1>
          <p className="text-xs text-white/50">Auto-detected from your workspace discussion groups</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePredictDelays}
            disabled={loadingAi}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-tg-themePurple to-tg-themeBlue hover:from-tg-themePurple/90 hover:to-tg-themeBlue/90 rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50"
          >
            <AutoGraph className="!text-sm" />
            {loadingAi ? 'Predicting Delays...' : 'AI Delay Prediction'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-tg-themeBlue hover:bg-tg-themeBlue/80 rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Add className="!text-sm" />
            Create Task
          </button>
        </div>
      </div>

      {/* AI Delay Predictor Output card */}
      {loadingAi && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 animate-pulse text-xs text-white/40 flex items-center gap-3">
          <TrendingDown className="animate-bounce text-tg-themePurple" />
          AI is running risk models across active sprint schedules...
        </div>
      )}
      {aiReport && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-tg-themePurple/10 to-tg-themeBlue/5 border border-tg-themePurple/25 relative">
          <h3 className="text-sm font-semibold text-tg-themePurple mb-2 flex items-center gap-1.5">
            <AutoGraph className="!text-base" />
            AI Project Director Delays & Risk Analysis
          </h3>
          <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{aiReport}</p>
          <button
            onClick={() => setAiReport('')}
            className="absolute top-4 right-4 text-xs text-white/40 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban Board columns wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="flex flex-col bg-white/5 rounded-2xl border border-white/10 min-h-[450px]">
              {/* Column Header */}
              <div className={`p-4 border-b border-white/10 flex justify-between items-center border-t-2 ${col.border}`}>
                <span className="font-semibold text-sm">{col.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded-full text-white/60">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Items */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[500px] scrollbar-thin">
                {colTasks.map(task => {
                  const isOverdue = task.dueDate && new Date() > new Date(task.dueDate) && task.status !== 'done';
                  return (
                    <div
                      key={task._id}
                      onClick={() => handleMoveStatus(task._id, task.status)}
                      className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer select-none space-y-3 group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-tg-themeBlue transition-all">
                          {task.title}
                        </h4>
                        <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                          task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                          task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtask completion rate */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-white/40 font-mono">
                            <span>Subtasks</span>
                            <span>
                              {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-tg-themeGreen"
                              style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-white/40">
                        <div className="flex items-center gap-1">
                          <CalendarToday className="!text-[10px] text-white/30" />
                          <span className={isOverdue ? 'text-red-400 font-semibold' : ''}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                            <span className="font-mono text-white/60">@{task.assignee.username}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center">
          <form onSubmit={handleCreateTask} className="w-full max-w-md bg-tg-bgSidebarDark border border-white/10 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold">Create New Task</h2>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Task Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeBlue"
                placeholder="e.g. Build API endpoint"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeBlue h-20"
                placeholder="Enter details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-white/40">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeBlue"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-tg-themeBlue"
                />
              </div>
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
                className="px-4 py-2 bg-tg-themeBlue hover:bg-tg-themeBlue/80 rounded-xl text-xs font-semibold text-white"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;
