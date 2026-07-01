import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SmartToy,
  Close,
  Send,
  Translate,
  Summarize,
  Email,
  Assessment,
  BubbleChart
} from '@mui/icons-material';

const AIAssistantDrawer = ({ isOpen, onClose, activeChat, activeChatType }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Workspace Assistant. I am ready to help you summarize discussions, draft emails, translate messages, or manage tasks.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  const [summary, setSummary] = useState('');
  const [emailDraft, setEmailDraft] = useState('');

  // Reset helper stats on open
  useEffect(() => {
    if (isOpen) {
      setSummary('');
      setEmailDraft('');
    }
  }, [isOpen]);

  const handleSendPrompt = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const chatHistory = messages
        .slice(-6)
        .map(m => ({ sender: m.sender === 'ai' ? 'assistant' : 'user', text: m.text }));

      const response = await api.post('/ai/assistant', {
        prompt: userMessage.text,
        chatHistory
      });

      setMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error generating response: ${error.response?.data?.message || error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeChat) return;
    setLoading(true);
    try {
      const response = await api.post('/ai/summarize', {
        chatId: activeChat._id,
        chatType: activeChatType
      });
      setSummary(response.data.summary);
      setMessages(prev => [...prev, { sender: 'ai', text: `**Here is the summary of the latest discussion:**\n\n${response.data.summary}` }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Failed to compile summary: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!activeChat) return;
    setLoading(true);
    try {
      // Simulate reading chat history for email context
      const chatContextText = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text)
        .join('\n');

      const response = await api.post('/ai/generate-email', {
        chatText: chatContextText || "Update on project deliverables, task assignments and daily standup points."
      });
      setEmailDraft(response.data.emailDraft);
      setMessages(prev => [...prev, { sender: 'ai', text: `**Generated Corporate Email Draft:**\n\n${response.data.emailDraft}` }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Failed to generate email: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateChat = async () => {
    if (messages.length < 2) return;
    setLoading(true);
    try {
      const lastMsg = messages[messages.length - 1].text;
      const response = await api.post('/ai/translate', {
        text: lastMsg,
        targetLanguage: selectedLang
      });
      setMessages(prev => [...prev, { sender: 'ai', text: `**Translated to ${selectedLang}:**\n\n${response.data.translation}` }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Translation failed: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-[420px] bg-tg-bgSidebarDark/90 backdrop-blur-xl border-l border-white/10 text-white z-[9999] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <SmartToy className="text-tg-primary text-tg-themeBlue" />
              <span className="font-semibold text-lg">AI Workspace Assistant</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <Close />
            </button>
          </div>

          {/* Quick AI Action Tools */}
          <div className="p-3 bg-white/5 border-b border-white/10 grid grid-cols-2 gap-2">
            <button
              onClick={handleSummarize}
              disabled={loading || !activeChat}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-all disabled:opacity-50"
            >
              <Summarize className="text-tg-themeBlue !text-base" />
              Summarize Chat
            </button>
            <button
              onClick={handleGenerateEmail}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-all disabled:opacity-50"
            >
              <Email className="text-tg-themeGreen !text-base" />
              Draft Email
            </button>

            <div className="col-span-2 flex items-center gap-2 mt-1">
              <button
                onClick={handleTranslateChat}
                disabled={loading}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-all flex-1"
              >
                <Translate className="text-tg-themeAmber !text-base" />
                Translate Last Msg
              </button>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-tg-bgSidebarDark border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="Hindi">Hindi</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese">Chinese</option>
                <option value="Arabic">Arabic</option>
                <option value="Russian">Russian</option>
              </select>
            </div>
          </div>

          {/* Messages Log area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow ${
                    m.sender === 'user'
                      ? 'bg-tg-themeBlue text-white rounded-tr-none'
                      : 'bg-white/10 text-slate-100 rounded-tl-none border border-white/5'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-white/50 animate-pulse">
                <BubbleChart className="animate-spin text-tg-themeBlue" />
                Assistant is thinking...
              </div>
            )}
          </div>

          {/* Prompt Entry Box */}
          <form onSubmit={handleSendPrompt} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about this chat or task..."
              className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-tg-themeBlue transition-all"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2.5 bg-tg-themeBlue hover:bg-tg-themeBlue/80 text-white rounded-xl transition-all disabled:opacity-50"
            >
              <Send className="!text-lg" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantDrawer;
