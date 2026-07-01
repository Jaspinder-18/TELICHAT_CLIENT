import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Person,
  Group,
  Assignment,
  Translate,
  Settings,
  HelpOutline
} from '@mui/icons-material';

const CommandPalette = ({ isOpen, onClose, onSelectAction, contacts = [], groups = [] }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle global key events for selection
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[activeIndex]) {
        handleSelectItem(filteredItems[activeIndex]);
      }
    }
  };

  // Compile static command list combined with dynamic contacts/groups
  const staticCommands = [
    { id: 'goto_tasks', title: 'Open Tasks Dashboard', category: 'Navigation', icon: <Assignment className="text-tg-themeBlue" /> },
    { id: 'goto_approvals', title: 'Open Smart Approval Center', category: 'Navigation', icon: <Assignment className="text-tg-themeGreen" /> },
    { id: 'goto_workflow', title: 'Open Automation Workflow Builder', category: 'Navigation', icon: <Settings className="text-tg-themeAmber" /> },
    { id: 'ai_translate_tool', title: 'Translate Active Chat', category: 'AI Tools', icon: <Translate className="text-tg-themePurple" /> },
    { id: 'help', title: 'Search Knowledge Base AI', category: 'Support', icon: <HelpOutline className="text-slate-400" /> }
  ];

  const allItems = [
    ...staticCommands,
    ...contacts.map(c => ({ id: `contact_${c._id}`, title: `Chat with ${c.firstName} ${c.lastName || ''} (@${c.username})`, category: 'Contacts', icon: <Person className="text-tg-themeBlue" />, data: c })),
    ...groups.map(g => ({ id: `group_${g._id}`, title: `Open Group: ${g.name}`, category: 'Groups', icon: <Group className="text-tg-themeGreen" />, data: g }))
  ];

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectItem = (item) => {
    onSelectAction(item);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Console box container */}
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-tg-bgSidebarDark/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 text-white flex flex-col max-h-[450px]"
          >
            {/* Input search row */}
            <div className="flex items-center px-4 border-b border-white/10 bg-white/5">
              <Search className="text-white/40 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="w-full bg-transparent py-4 text-sm outline-none text-white placeholder-white/30"
              />
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/50 border border-white/5 font-mono select-none">
                ESC
              </span>
            </div>

            {/* Results body */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/40">
                  No matching commands or contacts found.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        idx === activeIndex
                          ? 'bg-tg-themeBlue text-white shadow-lg shadow-tg-themeBlue/25'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-1.5 rounded-lg bg-white/5 ${idx === activeIndex ? 'bg-white/20' : ''}`}>
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                        idx === activeIndex ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Console footer shortcuts */}
            <div className="px-4 py-2.5 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-white/40">
              <div className="flex gap-4">
                <span>↑↓ to navigate</span>
                <span>Enter to select</span>
              </div>
              <span>Ctrl + K to toggle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
