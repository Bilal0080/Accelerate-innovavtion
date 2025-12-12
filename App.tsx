import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  BarChart2, 
  Zap, 
  MessageSquare, 
  Cpu, 
  Menu, 
  X,
  Lightbulb,
  ArrowRight,
  Plus,
  Download,
  FileText,
  History,
  Trash2,
  Clock,
  Command
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { AppMode, Message, Role, AnalysisResult, SavedSession } from './types';
import { streamChatResponse, analyzeIdea } from './services/geminiService';
import { AnalysisChart } from './components/AnalysisChart';
import { Loader } from './components/Loader';

const SUGGESTIONS_CHAT = [
  "Brainstorm features for a sustainable fitness app",
  "Apply the SCAMPER technique to a coffee cup",
  "Identify emerging trends in remote work tools",
  "Generate 5 radical ideas for urban transportation"
];

const SUGGESTIONS_ANALYZE = [
  "A subscription service for renting high-end baby clothes",
  "AI-powered personal stylist app using augmented reality",
  "Smart plant pot that waters itself and tracks soil health",
  "Peer-to-peer storage marketplace for neighborhoods"
];

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: Role.MODEL,
      text: "Hello! I'm Catalyst. I'm here to help you accelerate your innovation process. Want to brainstorm ideas or analyze a specific concept?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessionId, setSessionId] = useState(Date.now().toString());
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- Persistence Logic ---

  // Load sessions from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('catalyst_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }
  }, []);

  // Save sessions to local storage whenever they update
  useEffect(() => {
    localStorage.setItem('catalyst_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Auto-save current session state
  useEffect(() => {
    // Only save if there is meaningful content
    const hasChatContent = messages.length > 1; // More than just the greeting
    const hasAnalysisContent = analysisResult !== null;

    if (!hasChatContent && !hasAnalysisContent) return;

    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === sessionId);
      
      let title = "New Session";
      if (analysisResult) {
        title = analysisResult.ideaName;
      } else if (messages.length > 1) {
        const firstUserMsg = messages.find(m => m.role === Role.USER);
        if (firstUserMsg) {
          title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
        }
      }

      const currentSessionData: SavedSession = {
        id: sessionId,
        title,
        date: Date.now(),
        mode,
        messages,
        analysisResult
      };

      if (existingIndex >= 0) {
        const newSessions = [...prev];
        // Only update if something actually changed to avoid unnecessary re-renders or logic
        // (Simple optimization: always update for now to keep timestamp fresh on interaction)
        newSessions[existingIndex] = currentSessionData;
        // Sort by date desc
        return newSessions.sort((a, b) => b.date - a.date);
      } else {
        return [currentSessionData, ...prev].sort((a, b) => b.date - a.date);
      }
    });
  }, [messages, analysisResult, sessionId, mode]);

  // --- View Logic ---

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, mode]);

  // Auto-focus and clear input when mode changes
  useEffect(() => {
    setInput('');
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [mode]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      // Create a placeholder for the AI response
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now()
      }]);

      const stream = streamChatResponse(messages, userMsg.text);
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullText } : msg
        ));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "I encountered an error connecting to the neural innovation network. Please try again.",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, messages]);

  const handleAnalyze = async () => {
    if (!input.trim() || isAnalysisLoading) return;

    setIsAnalysisLoading(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeIdea(input);
      setAnalysisResult(result);
      setInput('');
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "Hello! I'm Catalyst. I'm here to help you accelerate your innovation process. Want to brainstorm ideas or analyze a specific concept?",
        timestamp: Date.now()
      }
    ]);
    setAnalysisResult(null);
    setSessionId(Date.now().toString());
    setMode(AppMode.CHAT);
    setIsSidebarOpen(false);
    setInput('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleLoadSession = (session: SavedSession) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setAnalysisResult(session.analysisResult);
    setMode(session.mode);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent loading the session when clicking delete
    setSessions(prev => prev.filter(s => s.id !== id));
    
    // If we deleted the current session, start a new one
    if (sessionId === id) {
        handleNewChat();
    }
  };

  const handleExportCSV = () => {
    if (!analysisResult) return;
    const headers = ["Metric", "Score", "Reasoning"];
    const rows = analysisResult.metrics.map(m => `"${m.metric}","${m.score}","${m.reasoning.replace(/"/g, '""')}"`);
    const csvContent = [
      `"Idea Name","${analysisResult.ideaName.replace(/"/g, '""')}"`,
      `"Summary","${analysisResult.summary.replace(/"/g, '""')}"`,
      `"Overall Score","${analysisResult.overallScore}"`,
      `"Recommendation","${analysisResult.recommendation.replace(/"/g, '""')}"`,
      "",
      headers.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${analysisResult.ideaName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!analysisResult) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Market Feasibility Analysis", 14, 22);
    
    // Idea Name
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233); // catalyst-500
    doc.text(analysisResult.ideaName, 14, 32);
    
    // Summary
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(analysisResult.summary, 180);
    doc.text(summaryLines, 14, 42);
    
    let yPos = 42 + (summaryLines.length * 5) + 10;
    
    // Overall Score
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Overall Score: ${analysisResult.overallScore}/100`, 14, yPos);
    
    yPos += 10;
    
    // Table
    const tableData = analysisResult.metrics.map(m => [m.metric, m.score.toString(), m.reasoning]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Score', 'Reasoning']],
      body: tableData,
      headStyles: { fillColor: [14, 165, 233] },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 'auto' }
      },
      margin: { top: 20 }
    });
    
    // Recommendation
    // @ts-ignore
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : yPos + 60;
    
    doc.setFontSize(12);
    doc.setTextColor(14, 165, 233);
    doc.text("Strategic Recommendation:", 14, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const recLines = doc.splitTextToSize(analysisResult.recommendation, 180);
    doc.text(recLines, 14, finalY + 7);
    
    doc.save(`${analysisResult.ideaName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === AppMode.CHAT) {
        handleSendMessage();
      } else {
        handleAnalyze();
      }
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // --- Render Helpers ---

  const renderSuggestions = (suggestions: string[]) => (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="md:col-span-2 text-center mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-center">
          <Command size={12} className="mr-2" /> Suggested Prompts
        </p>
      </div>
      {suggestions.map((text, idx) => (
        <button
          key={idx}
          onClick={() => handleUseSuggestion(text)}
          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 text-sm text-left px-4 py-3 rounded-xl transition-all duration-200 group flex items-start"
        >
          <Zap size={14} className="mt-0.5 mr-2.5 text-catalyst-500 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
          <span className="line-clamp-2">{text}</span>
        </button>
      ))}
    </div>
  );

  const renderChatBubble = (msg: Message) => {
    const isUser = msg.role === Role.USER;
    const animationClass = isUser ? 'animate-slide-in-right' : 'animate-slide-in-left';
    return (
      <div 
        key={msg.id} 
        className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} ${animationClass}`}
      >
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-catalyst-400 to-catalyst-600 flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-catalyst-500/20">
            <Zap size={16} className="text-white" />
          </div>
        )}
        
        <div 
          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-6 backdrop-blur-sm ${
            isUser 
              ? 'bg-catalyst-600 text-white rounded-tr-none shadow-lg shadow-catalyst-600/10' 
              : 'bg-slate-800/80 border border-slate-700/50 text-slate-100 rounded-tl-none shadow-xl'
          }`}
        >
          {msg.text ? (
             <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
               <ReactMarkdown>{msg.text}</ReactMarkdown>
             </div>
          ) : (
            <Loader />
          )}
        </div>
      </div>
    );
  };

  const renderAnalysisView = () => (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {!analysisResult && !isAnalysisLoading && (
        <div className="text-center py-20 px-4 w-full">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
            <BarChart2 size={40} className="text-catalyst-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Market Feasibility Analysis</h2>
          <p className="text-slate-400 max-w-lg mx-auto text-lg mb-8">
            Enter your idea below to receive a comprehensive 5-point assessment covering Feasibility, Desirability, Viability, Novelty, and Timing.
          </p>
          {renderSuggestions(SUGGESTIONS_ANALYZE)}
        </div>
      )}

      {isAnalysisLoading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 rounded-full border-t-2 border-catalyst-500 animate-spin"></div>
             <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin [animation-duration:1.5s]"></div>
             <div className="absolute inset-4 rounded-full border-b-2 border-emerald-500 animate-spin [animation-duration:2s]"></div>
          </div>
          <p className="text-catalyst-300 font-medium animate-pulse">Crunching market data...</p>
        </div>
      )}

      {analysisResult && (
        <div className="w-full space-y-6 animate-slide-up">
          <div className="w-full flex justify-end space-x-3 mb-2 px-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 text-sm font-medium"
            >
              <FileText size={14} />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-catalyst-600 hover:bg-catalyst-500 text-white transition-colors shadow-lg shadow-catalyst-500/20 text-sm font-medium"
            >
              <Download size={14} />
              <span>Export PDF</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-catalyst-500 to-transparent opacity-50"></div>
               <h3 className="text-slate-300 font-medium mb-4 text-center uppercase tracking-wider text-sm">Visual Metrics</h3>
               <AnalysisChart data={analysisResult} />
               <div className="mt-4 text-center">
                  <span className="text-4xl font-bold text-white">{analysisResult.overallScore}</span>
                  <span className="text-slate-500 text-sm block uppercase tracking-wide mt-1">Overall Score</span>
               </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-2">{analysisResult.ideaName}</h2>
              <p className="text-slate-300 mb-6 italic border-l-4 border-catalyst-500 pl-4 py-1 bg-slate-800/50 rounded-r">
                {analysisResult.summary}
              </p>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Detailed Breakdown</h4>
                {analysisResult.metrics.map((m, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{m.metric}</span>
                      <span className={`text-sm font-bold ${m.score > 75 ? 'text-emerald-400' : m.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {m.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full mb-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${m.score > 75 ? 'bg-emerald-500' : m.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${m.score}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-slate-400 leading-snug">{m.reasoning}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-catalyst-300 uppercase tracking-wider mb-2 flex items-center">
                  <Lightbulb size={16} className="mr-2" /> 
                  Strategic Recommendation
                </h4>
                <p className="text-slate-200">{analysisResult.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans selection:bg-catalyst-500/30">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col h-full`}
      >
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-catalyst-500 to-purple-600 flex items-center justify-center shadow-lg shadow-catalyst-500/20">
              <Cpu className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Catalyst</h1>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Innovation AI</p>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-catalyst-600 to-catalyst-500 hover:from-catalyst-500 hover:to-catalyst-400 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-catalyst-500/20 mb-6 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="font-semibold">New Session</span>
          </button>

          <nav className="space-y-2 mb-6">
            <button 
              onClick={() => { setMode(AppMode.CHAT); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                mode === AppMode.CHAT 
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={20} />
              <span className="font-medium">Brainstorm Chat</span>
            </button>
            <button 
              onClick={() => { setMode(AppMode.ANALYZE); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                mode === AppMode.ANALYZE 
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Sparkles size={20} />
              <span className="font-medium">Feasibility Check</span>
            </button>
          </nav>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
           {sessions.length > 0 && (
             <>
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center">
                 <History size={12} className="mr-2" /> History
               </h3>
               <div className="space-y-2">
                 {sessions.map((session) => (
                   <div 
                    key={session.id}
                    onClick={() => handleLoadSession(session)}
                    className={`group relative flex flex-col p-3 rounded-lg border transition-all cursor-pointer ${
                      sessionId === session.id 
                        ? 'bg-slate-800/80 border-slate-700 shadow-md' 
                        : 'bg-transparent border-transparent hover:bg-slate-800/30 hover:border-slate-800'
                    }`}
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex items-center space-x-2 overflow-hidden">
                          {session.mode === AppMode.CHAT ? (
                            <MessageSquare size={14} className="text-catalyst-400 shrink-0" />
                          ) : (
                            <BarChart2 size={14} className="text-purple-400 shrink-0" />
                          )}
                          <span className={`text-sm font-medium truncate ${sessionId === session.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {session.title}
                          </span>
                       </div>
                       <button
                         onClick={(e) => handleDeleteSession(e, session.id)}
                         className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                     <span className="text-[10px] text-slate-500 mt-1 pl-6">
                       {new Date(session.date).toLocaleDateString()}
                     </span>
                   </div>
                 ))}
               </div>
             </>
           )}
        </div>

        <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Current Model</p>
              <div className="flex items-center text-catalyst-300 text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                gemini-2.5-flash
              </div>
            </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur z-10 flex items-center justify-between px-4 sm:px-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <div className="md:hidden flex items-center space-x-2">
             <Cpu className="text-catalyst-500" size={20} />
             <span className="font-bold text-white">Catalyst</span>
          </div>
          <div className="hidden md:block">
            {/* Show info about current session */}
            <span className="text-slate-500 text-sm flex items-center">
              <Clock size={14} className="mr-2" />
              Session ID: <span className="text-slate-300 font-mono ml-1">XC-{sessionId.slice(-4)}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
             {/* Additional header items like user profile could go here */}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          {mode === AppMode.CHAT ? (
            <div className="max-w-3xl mx-auto min-h-full flex flex-col">
              {messages.map(renderChatBubble)}
              {/* Render suggestions if in chat mode and only greeting exists */}
              {messages.length === 1 && renderSuggestions(SUGGESTIONS_CHAT)}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          ) : (
             renderAnalysisView()
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900/95 backdrop-blur-md p-4 sm:p-6 z-20">
          <div className="max-w-3xl mx-auto relative">
             <div className={`absolute -top-12 left-0 right-0 flex justify-center transition-opacity duration-300 ${isGenerating || isAnalysisLoading ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-catalyst-900/80 text-catalyst-200 text-xs py-1 px-3 rounded-full border border-catalyst-700/50 backdrop-blur flex items-center shadow-lg">
                  <div className="w-1.5 h-1.5 bg-catalyst-400 rounded-full animate-ping mr-2"></div>
                  AI is processing...
                </div>
             </div>
            <div className="relative group">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={mode === AppMode.CHAT ? "Ask Catalyst to help brainstorm..." : "Describe your idea for analysis..."}
                className="w-full bg-slate-800 text-slate-100 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-catalyst-500/50 transition-all shadow-inner border border-slate-700 resize-none overflow-hidden"
                rows={1}
                style={{ minHeight: '60px' }}
                disabled={isGenerating || isAnalysisLoading}
              />
              <button
                onClick={mode === AppMode.CHAT ? handleSendMessage : handleAnalyze}
                disabled={!input.trim() || isGenerating || isAnalysisLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-catalyst-500 hover:bg-catalyst-400 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-catalyst-500 shadow-lg shadow-catalyst-500/20"
              >
                {mode === AppMode.CHAT ? <Send size={20} /> : <ArrowRight size={20} />}
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-3">
              Powered by <span className="text-catalyst-400 font-medium">Gemini 2.5 Flash</span>. AI can make mistakes.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;