import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Users, Mic, Image as ImageIcon, Paperclip, Loader2, StopCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

let socket;
let mediaRecorder;
let audioChunks = [];

export default function TeamChat({ isDarkMode = true }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    socket = io('http://localhost:5000');

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/chat', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
        await fetch('http://localhost:5000/api/chat/mark-read', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };
    fetchHistory();

    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (text.trim() && user.id) {
      socket.emit('sendMessage', { userId: user.id, text });
      setText('');
    }
  };

  // --- FILE UPLOAD ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        let fileType = 'document';
        if (file.type.startsWith('image/')) fileType = 'image';
        if (file.type.startsWith('video/')) fileType = 'video';
        if (file.type.startsWith('audio/')) fileType = 'audio';

        socket.emit('sendMessage', {
          userId: user.id,
          text: '',
          fileUrl: data.fileUrl,
          fileType,
          fileName: data.fileName
        });
      } else {
        toast.error('File upload failed');
      }
    } catch (err) {
      toast.error('Upload error');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // --- AUDIO RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', audioFile);

        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/chat/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();

          if (res.ok) {
            socket.emit('sendMessage', {
              userId: user.id,
              text: '',
              fileUrl: data.fileUrl,
              fileType: 'audio',
              fileName: 'Voice Message'
            });
          }
        } catch (err) {
          toast.error('Audio upload failed');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  // --- RENDER MESSAGE CONTENT ---
  const renderMessageContent = (msg) => {
    if (msg.fileUrl) {
      if (msg.fileType === 'image') {
        return (
          <div className="mt-1">
            <img src={msg.fileUrl} alt="attachment" className="max-w-[200px] sm:max-w-xs rounded-xl shadow-sm border border-white/20" />
            {msg.text && <p className="mt-2">{msg.text}</p>}
          </div>
        );
      }
      if (msg.fileType === 'audio') {
        return (
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-xs font-bold opacity-80 flex items-center gap-1"><Mic size={12}/> Voice Message</span>
            <audio controls src={msg.fileUrl} className="h-8 w-48 sm:w-64" />
          </div>
        );
      }
      return (
        <div className="mt-1">
          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm font-bold opacity-90 hover:opacity-100">
            <Paperclip size={16} /> {msg.fileName || 'Download File'}
          </a>
          {msg.text && <p className="mt-2">{msg.text}</p>}
        </div>
      );
    }
    return <p>{msg.text}</p>;
  };

  return (
    <div className={`flex flex-col h-[75vh] ${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f] text-white' : 'bg-white border-slate-200 text-slate-900'} backdrop-blur-lg rounded-3xl border shadow-xl overflow-hidden`}>
      {/* Chat Header */}
      <div className={`p-4 sm:p-6 border-b flex items-center gap-4 ${isDarkMode ? 'border-[#1e3a5f] bg-[#071426]/80' : 'border-slate-200 bg-slate-50'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#1e3a5f] text-[#38BDF8]' : 'bg-indigo-100 text-indigo-600'}`}>
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Global Workspace Chat</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Secure communication & media sharing</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.sender?._id === user.id;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              key={msg._id || idx} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">{isMe ? 'You' : msg.sender?.fullName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-slate-200 text-slate-700'}`}>
                  {msg.sender?.role}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`max-w-[85%] sm:max-w-[70%] px-5 py-3 rounded-2xl ${
                isMe 
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#38BDF8] text-white rounded-br-sm shadow-md' 
                  : isDarkMode ? 'bg-[#1e3a5f] text-white rounded-bl-sm shadow-md' : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-sm shadow-sm'
              }`}>
                {renderMessageContent(msg)}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-[#1e3a5f] bg-[#071426]/80' : 'border-slate-200 bg-slate-50'}`}>
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-[#4F46E5] mb-3 font-bold animate-pulse">
            <Loader2 size={16} className="animate-spin" /> Uploading media...
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-4 items-center">
          
          {/* File Upload Hidden Input */}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*, .pdf, .doc, .docx, .xls, .xlsx" />
          
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-full transition-colors ${isDarkMode ? 'bg-[#1e3a5f] text-gray-300 hover:text-white hover:bg-[#2d5284]' : 'bg-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-300'}`}>
            <Paperclip size={20} />
          </button>

          {isRecording ? (
            <button type="button" onClick={stopRecording} className="p-3 rounded-full bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <StopCircle size={20} />
            </button>
          ) : (
            <button type="button" onClick={startRecording} className={`p-3 rounded-full transition-colors ${isDarkMode ? 'bg-[#1e3a5f] text-gray-300 hover:text-white hover:bg-[#2d5284]' : 'bg-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-300'}`}>
              <Mic size={20} />
            </button>
          )}

          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording || isUploading}
            placeholder={isRecording ? "Recording audio..." : `Message as ${user.fullName}...`}
            className={`flex-1 rounded-xl px-4 sm:px-6 py-3 focus:outline-none transition-all ${
              isDarkMode 
                ? 'bg-[#0f213d] border border-[#1e3a5f] text-white focus:border-[#4F46E5]' 
                : 'bg-white border border-slate-300 text-slate-900 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]'
            }`}
          />
          <button 
            type="submit" 
            disabled={!text.trim() || isUploading || isRecording}
            className={`p-3 sm:px-6 sm:py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              text.trim() && !isUploading && !isRecording
                ? 'bg-[#4F46E5] text-white hover:bg-[#4338ca] shadow-lg' 
                : isDarkMode ? 'bg-[#1e3a5f] text-gray-400 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
