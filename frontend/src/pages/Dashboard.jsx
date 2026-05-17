import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  LayoutDashboard, Target, Users, Briefcase, Bell, Search, Settings,
  LogOut, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, Moon, Sun,
  Award, BookOpen, MessageSquare, LineChart, Shield, X, Menu, Clock, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MyGoals from '../components/MyGoals';
import TeamHub from '../components/TeamHub';
import TeamChat from '../components/TeamChat';

const COLORS = ['#10B981', '#FFC107', '#EF4444', '#4F46E5', '#6B7280'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const activeTabRef = useRef(activeTab);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [promotionActions, setPromotionActions] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [teamAnalytics, setTeamAnalytics] = useState(null);

  // Parse logged in user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    navigate('/login');
  }

  useEffect(() => {
    fetchAnalytics();
    fetchUnreadMessages();
    if (['manager', 'hr', 'admin'].includes(user.role)) fetchAdminData('Promotion Board');
    if (['hr', 'admin'].includes(user.role)) {
      fetchAdminData('Departments');
      fetchAdminData('Audit Logs');
    }
  }, [user.id]);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'Workspace Chat') {
      markWorkspaceRead();
    }
    if (activeTab === 'Team Analytics') {
      fetchTeamAnalytics();
    }
    if (['Promotion Board', 'Departments', 'Audit Logs'].includes(activeTab)) {
      fetchAdminData(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const socket = io('https://zenthra-dm3x.onrender.com');
    socket.on('receiveMessage', (message) => {
      if (message.sender?._id !== user.id && activeTabRef.current !== 'Workspace Chat') {
        setUnreadMessages(prev => prev + 1);
        playNotificationSound();
        toast.success(`New workspace message from ${message.sender?.fullName || 'someone'}`, { icon: '💬' });
        setNotifications(prev => [{
          id: Date.now(),
          text: `New workspace message from ${message.sender?.fullName || 'User'}`,
          time: new Date(),
          type: 'message'
        }, ...prev]);
      }
    });
    return () => socket.disconnect();
  }, [user.id]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://zenthra-dm3x.onrender.com/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const apiFetch = async (path, options = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`https://zenthra-dm3x.onrender.com${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Request failed');
    }
    return res.json();
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 740;
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
    } catch (err) {
      console.warn('Notification sound blocked by browser', err);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const data = await apiFetch('/api/chat/unread-count');
      setUnreadMessages(data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const markWorkspaceRead = async () => {
    try {
      await apiFetch('/api/chat/mark-read', { method: 'PUT' });
      setUnreadMessages(0);
      setNotifications(prev => prev.filter(n => n.type !== 'message'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async (tab = activeTab) => {
    try {
      if (tab === 'Promotion Board') {
        setEmployees(await apiFetch('/api/admin/employees'));
      }
      if (tab === 'Departments') {
        setDepartments(await apiFetch('/api/admin/departments'));
      }
      if (tab === 'Audit Logs') {
        const [logs, openEscalations] = await Promise.all([
          apiFetch('/api/admin/audit-logs'),
          apiFetch('/api/admin/escalations')
        ]);
        setAuditLogs(logs);
        setEscalations(openEscalations);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchTeamAnalytics = async () => {
    try {
      setTeamAnalytics(await apiFetch('/api/manager/analytics'));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePromotionDecision = async (employeeId, decision) => {
    try {
      const result = await apiFetch(`/api/admin/employees/${employeeId}/promotion`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      setPromotionActions(prev => ({ ...prev, [employeeId]: decision }));
      setEmployees(prev => prev.map(emp => emp._id === employeeId ? { ...emp, designation: result.employee.designation } : emp));
      toast.success(decision === 'promoted' ? 'Employee promoted' : 'Promotion rejected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resolveEscalation = async (id) => {
    try {
      await apiFetch(`/api/admin/escalations/${id}/resolve`, { method: 'POST' });
      setEscalations(prev => prev.map(item => item._id === id ? { ...item, isResolved: true } : item));
      fetchAnalytics();
      toast.success('Escalation resolved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard, roles: ['employee', 'manager', 'hr', 'admin'] },
    { name: 'My Goals', icon: Target, roles: ['employee', 'manager', 'hr', 'admin'] },
    { name: 'Workspace Chat', icon: MessageSquare, roles: ['employee', 'manager', 'hr', 'admin'] },

    { name: 'Learning & Dev', icon: BookOpen, roles: ['employee'] },


    { name: 'Team Analytics', icon: LineChart, roles: ['manager'] },
    { name: 'Promotion Board', icon: TrendingUp, roles: ['manager', 'hr', 'admin'] },
    { name: 'Departments', icon: Briefcase, roles: ['hr', 'admin'] },
    { name: 'Audit Logs', icon: Shield, roles: ['hr', 'admin'] },
  ].filter(item => item.roles.includes(user.role || 'employee'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const quarterlyData = [
    { name: 'Q1', target: 80, achieved: stats?.avgCompletion || 0, baseline: 50 },
    { name: 'Q2', target: 85, achieved: 0, baseline: 55 },
    { name: 'Q3', target: 90, achieved: 0, baseline: 60 },
    { name: 'Q4', target: 95, achieved: 0, baseline: 65 },
  ];

  const learningTracks = [
    {
      title: 'AI Fundamentals',
      level: 'Beginner',
      duration: '4 weeks',
      brief: 'Learn what artificial intelligence is, how machine learning models find patterns, where generative AI helps at work, and how to use prompts responsibly.',
      lessons: ['AI basics', 'Prompt writing', 'Responsible AI', 'Use cases in HR and delivery'],
      basics: [
        'AI means software that can perform tasks that usually need human intelligence.',
        'Machine learning learns from data and improves predictions over time.',
        'Generative AI can create text, summaries, images, and code from prompts.'
      ]
    },
    {
      title: 'HTML Essentials',
      level: 'Beginner',
      duration: '1 week',
      brief: 'HTML is the structure of a web page. It uses tags like headings, paragraphs, links, images, forms, and tables to describe content for browsers.',
      lessons: ['Page structure', 'Semantic tags', 'Forms', 'Accessibility basics'],
      basics: [
        'HTML stands for HyperText Markup Language.',
        'It defines page content using elements like h1, p, a, img, input, and button.',
        'Semantic HTML helps browsers, search engines, and screen readers understand the page.'
      ]
    },
    {
      title: 'CSS Styling',
      level: 'Beginner',
      duration: '2 weeks',
      brief: 'CSS controls how HTML looks. Employees learn colors, spacing, layout, responsive design, flexbox, grid, and polished visual styling.',
      lessons: ['Selectors', 'Box model', 'Flexbox and grid', 'Responsive layouts'],
      basics: [
        'CSS stands for Cascading Style Sheets.',
        'It controls colors, fonts, spacing, borders, and layout.',
        'Responsive CSS makes the same page work nicely on phones, tablets, and desktops.'
      ]
    },
    {
      title: 'JavaScript Programming',
      level: 'Intermediate',
      duration: '4 weeks',
      brief: 'JavaScript adds logic and interaction to web apps, including variables, functions, events, API calls, arrays, objects, and modern async code.',
      lessons: ['Core syntax', 'DOM events', 'Fetch APIs', 'Async programming'],
      basics: [
        'JavaScript makes web pages interactive.',
        'It handles button clicks, form input, calculations, and API requests.',
        'Modern JavaScript uses promises and async/await for server communication.'
      ]
    },
    {
      title: 'Python for AI',
      level: 'Intermediate',
      duration: '5 weeks',
      brief: 'Python is widely used for automation, analytics, and AI. This path covers clean syntax, data handling, scripts, and ML-ready foundations.',
      lessons: ['Python basics', 'Data files', 'Automation', 'Intro to ML workflows'],
      basics: [
        'Python is a beginner-friendly programming language with readable syntax.',
        'It is used for automation, data analysis, backend scripts, and AI projects.',
        'Libraries like pandas and scikit-learn make Python powerful for data work.'
      ]
    },
    {
      title: 'Java Backend Basics',
      level: 'Intermediate',
      duration: '5 weeks',
      brief: 'Java is used for reliable enterprise systems. Employees learn OOP, services, APIs, Spring Boot concepts, and backend application structure.',
      lessons: ['OOP', 'Collections', 'REST APIs', 'Spring Boot overview'],
      basics: [
        'Java is a strongly typed language used in enterprise backend systems.',
        'OOP concepts like classes, objects, inheritance, and interfaces are central.',
        'Spring Boot helps teams build APIs and services faster.'
      ]
    }
  ];

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredLearningTracks = learningTracks.filter(track =>
    [track.title, track.level, track.duration, track.brief, ...track.lessons]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const filteredEmployees = employees.filter(employee =>
    [employee.fullName, employee.email, employee.empId, employee.department, employee.designation, employee.role]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const filteredDepartments = departments.filter(dept =>
    [dept.name, dept.employeeCount]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const filteredAuditLogs = auditLogs.filter(log =>
    [log.action, log.entityType, log.user?.fullName, log.newValues?.summary]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
  const searchResults = normalizedSearch ? [
    ...filteredLearningTracks.slice(0, 3).map(item => ({ tab: 'Learning & Dev', label: item.title, detail: item.brief })),
    ...filteredEmployees.slice(0, 4).map(item => ({ tab: 'Promotion Board', label: item.fullName, detail: `${item.designation} - ${item.department}` })),
    ...filteredDepartments.slice(0, 3).map(item => ({ tab: 'Departments', label: item.name, detail: `${item.employeeCount || 0} employees` })),
    ...filteredAuditLogs.slice(0, 3).map(item => ({ tab: 'Audit Logs', label: item.action, detail: item.newValues?.summary || item.entityType }))
  ].slice(0, 8) : [];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#040b17] text-white' : 'bg-[#f8fafc] text-[#0f172a]'} font-sans selection:bg-[#4F46E5]`}>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative w-64 h-full transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isDarkMode ? 'bg-[#071426] border-[#1e3a5f]' : 'bg-white border-slate-200 shadow-xl'} border-r flex flex-col justify-between`}>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className={`h-24 flex items-center justify-between px-6 border-b ${isDarkMode ? 'border-[#1e3a5f]' : 'border-slate-200'}`}>
            <img src="/src/assets/logo_full.png" alt="Zenthra" className={`h-16 w-auto object-contain ${!isDarkMode ? 'invert opacity-90' : 'mix-blend-screen contrast-[1.5]'}`} />
            <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs font-bold text-gray-400 mb-4 tracking-wider uppercase">Menu Modules</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => { setActiveTab(item.name); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.name
                    ? isDarkMode ? 'bg-gradient-to-r from-[#4F46E5]/20 to-transparent border-l-4 border-[#4F46E5] text-[#818cf8]' : 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-700 font-bold'
                    : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <item.icon size={20} className={activeTab === item.name ? (isDarkMode ? "text-[#818cf8]" : "text-indigo-600") : ""} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-[#1e3a5f]' : 'border-slate-200'}`}>
          <button onClick={() => setIsSettingsOpen(true)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-all mt-1">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background glow effects */}
        {isDarkMode && (
          <>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4F46E5]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#38BDF8]/10 rounded-full blur-[120px] pointer-events-none"></div>
          </>
        )}

        {/* TOPBAR */}
        <header className={`h-24 ${isDarkMode ? 'bg-[#071426]/95 border-[#1e3a5f]' : 'bg-white/95 border-slate-200 shadow-sm'} backdrop-blur-md border-b flex items-center justify-between px-4 lg:px-8 z-50 sticky top-0 transition-colors duration-300`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{activeTab}</h1>
              <p className={`text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Zenthra Enterprise Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-white/10' : 'text-indigo-600 hover:bg-slate-100'}`}>
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search workspace..." className={`${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f] text-white focus:border-[#4F46E5]' : 'bg-slate-100 border-transparent text-slate-900 focus:border-indigo-400 focus:bg-white'} border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none w-64 transition-all`} />
              {normalizedSearch && (
                <div className={`fixed top-20 right-36 w-96 max-h-[420px] rounded-2xl border shadow-2xl overflow-y-auto z-[9999] ${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f]' : 'bg-white border-slate-200'}`}>
                  {searchResults.length > 0 ? searchResults.map((result, index) => (
                    <button
                      key={`${result.tab}-${result.label}-${index}`}
                      onClick={() => { setActiveTab(result.tab); setSearchQuery(''); }}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${isDarkMode ? 'border-[#1e3a5f] hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{result.label}</p>
                      <p className={`text-xs mt-1 line-clamp-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{result.tab} - {result.detail}</p>
                    </button>
                  )) : (
                    <div className={`px-4 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>No matching workspace results</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
              >
                <Bell size={22} />
                {(stats?.escalations > 0 || unreadMessages > 0 || notifications.length > 0) && (
                  <>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDarkMode ? 'border-[#071426]' : 'border-white'}`}></span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border overflow-hidden z-50 ${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f]' : 'bg-white border-slate-200'}`}
                  >
                    <div className={`p-4 border-b ${isDarkMode ? 'border-[#1e3a5f]' : 'border-slate-200'} flex justify-between items-center`}>
                      <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Notifications</h3>
                      {(unreadMessages > 0 || notifications.length > 0) && (
                        <button
                          onClick={() => { setUnreadMessages(0); setNotifications([]); }}
                          className="text-xs text-[#4F46E5] hover:underline font-semibold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 && (!stats?.escalations || stats?.escalations === 0) ? (
                        <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          No new notifications
                        </div>
                      ) : (
                        <>
                          {stats?.escalations > 0 && (
                            <div className={`p-4 border-b ${isDarkMode ? 'border-[#1e3a5f] hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} flex gap-3 cursor-pointer`}>
                              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} />
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stats?.escalations} Escalations require your attention.</p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>System Alert</p>
                              </div>
                            </div>
                          )}
                          {notifications.map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                setActiveTab('Workspace Chat');
                                setIsNotificationsOpen(false);
                                setUnreadMessages(0);
                                setNotifications(prev => prev.filter(n => n.id !== notif.id));
                              }}
                              className={`p-4 border-b last:border-b-0 ${isDarkMode ? 'border-[#1e3a5f] hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} flex gap-3 cursor-pointer transition-colors`}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center shrink-0">
                                <MessageSquare size={16} />
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{notif.text}</p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Just now</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div onClick={() => setIsSettingsOpen(true)} className={`flex items-center gap-3 pl-3 lg:pl-6 border-l ${isDarkMode ? 'border-[#1e3a5f]' : 'border-slate-200'} cursor-pointer hover:opacity-80 transition-opacity`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#38BDF8] p-[2px] shadow-sm">
                <div className={`w-full h-full ${isDarkMode ? 'bg-[#071426]' : 'bg-white'} rounded-full flex items-center justify-center`}>
                  <span className={`font-bold text-sm ${isDarkMode ? 'text-[#38BDF8]' : 'text-indigo-600'}`}>{user.fullName ? user.fullName.charAt(0) : 'U'}</span>
                </div>
              </div>
              <div className="hidden md:block">
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user.fullName || 'Active User'}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'} capitalize`}>{user.role || 'Employee'}</p>
              </div>
              <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-slate-400'} />
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative z-10">

          {activeTab === 'Overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto space-y-8">

              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { title: 'Total Goals Set', value: stats?.totalGoals || 0, trend: '+12%', icon: Target, color: isDarkMode ? 'text-[#38BDF8]' : 'text-sky-600', bg: isDarkMode ? 'bg-[#38BDF8]/10' : 'bg-sky-100' },
                  { title: 'Avg. Completion', value: `${stats?.avgCompletion || 0}%`, trend: '+5.2%', icon: TrendingUp, color: isDarkMode ? 'text-[#10B981]' : 'text-emerald-600', bg: isDarkMode ? 'bg-[#10B981]/10' : 'bg-emerald-100' },
                  { title: 'Pending Approvals', value: stats?.pendingApprovals || 0, trend: '-8%', icon: CheckCircle2, color: isDarkMode ? 'text-[#FFC107]' : 'text-amber-600', bg: isDarkMode ? 'bg-[#FFC107]/10' : 'bg-amber-100' },
                  { title: 'Escalations', value: stats?.escalations || 0, trend: '-2', icon: AlertTriangle, color: isDarkMode ? 'text-[#EF4444]' : 'text-rose-600', bg: isDarkMode ? 'bg-[#EF4444]/10' : 'bg-rose-100' }
                ].map((kpi, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    key={idx} className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f] hover:bg-[#0f213d]' : 'bg-white border-slate-200 hover:shadow-md'} backdrop-blur-lg border rounded-2xl p-6 transition-all cursor-pointer`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${kpi.bg}`}>
                        <kpi.icon size={24} className={kpi.color} />
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? (isDarkMode ? 'text-green-400 bg-green-400/10' : 'text-emerald-700 bg-emerald-100') : (isDarkMode ? 'text-red-400 bg-red-400/10' : 'text-rose-700 bg-rose-100')}`}>
                        {kpi.trend}
                      </span>
                    </div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{kpi.title}</h4>
                    <p className={`text-3xl font-extrabold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{kpi.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* CHARTS ROW 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Area Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                  className={`lg:col-span-2 ${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200 shadow-sm'} backdrop-blur-lg border rounded-2xl p-6`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Quarterly Performance</h3>
                  </div>
                  <div className="h-[300px] min-h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={quarterlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAchieved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDarkMode ? '#4F46E5' : '#6366f1'} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={isDarkMode ? '#4F46E5' : '#6366f1'} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e3a5f' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={isDarkMode ? '#6b7280' : '#94a3b8'} axisLine={false} tickLine={false} />
                        <YAxis stroke={isDarkMode ? '#6b7280' : '#94a3b8'} axisLine={false} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: isDarkMode ? '#0f213d' : '#ffffff', border: `1px solid ${isDarkMode ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '12px' }}
                          itemStyle={{ color: isDarkMode ? '#fff' : '#0f172a' }}
                        />
                        <Area type="monotone" dataKey="achieved" stroke={isDarkMode ? '#4F46E5' : '#4f46e5'} strokeWidth={3} fillOpacity={1} fill="url(#colorAchieved)" />
                        <Area type="monotone" dataKey="target" stroke={isDarkMode ? '#FFC107' : '#f59e0b'} strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Donut Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                  className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200 shadow-sm'} backdrop-blur-lg border rounded-2xl p-6 flex flex-col`}
                >
                  <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Current Goal Status</h3>
                  <div className="flex-1 flex items-center justify-center -mt-4">
                    <div className="h-[250px] min-h-[250px] w-full min-w-0 relative">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={stats?.statusData || [{ name: 'Loading', value: 1 }]}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {(stats?.statusData || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: isDarkMode ? '#0f213d' : '#ffffff', border: `1px solid ${isDarkMode ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '12px', color: isDarkMode ? '#fff' : '#000' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stats?.totalGoals || 0}</span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Goals</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'My Goals' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto">
              <MyGoals isDarkMode={isDarkMode} searchQuery={searchQuery} />
            </motion.div>
          )}

          {activeTab === 'Team Hub' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto">
              <TeamHub isDarkMode={isDarkMode} searchQuery={searchQuery} />
            </motion.div>
          )}

          {activeTab === 'Workspace Chat' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto">
              <TeamChat isDarkMode={isDarkMode} />
            </motion.div>
          )}

          {/* PLACEHOLDER FOR NEW FEATURES */}
          {/* LEARNING & DEV */}
          {activeTab === 'Learning & Dev' && (
            <div className={`max-w-7xl mx-auto space-y-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                <p className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#38BDF8]' : 'text-indigo-600'}`}>Employee growth hub</p>
                <h1 className="text-3xl font-bold mt-2">Learning & Development</h1>
                <p className={`mt-3 max-w-3xl ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  Employees can learn AI concepts and practical programming languages with short briefs, lesson topics, and clear next steps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLearningTracks.map((track) => (
                  <div key={track.title} className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6 flex flex-col min-h-[280px]`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#1e3a5f] text-[#38BDF8]' : 'bg-indigo-100 text-indigo-600'}`}>
                        <BookOpen size={22} />
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>{track.level}</span>
                    </div>
                    <h2 className="text-xl font-bold mt-5">{track.title}</h2>
                    <p className={`text-sm mt-3 flex-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{track.brief}</p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {track.lessons.map(lesson => (
                        <span key={lesson} className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#071426] text-gray-300 border border-[#1e3a5f]' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{lesson}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-5">
                      <span className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}><Clock size={16} /> {track.duration}</span>
                      <button onClick={() => setSelectedCourse(track)} className="px-4 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338ca] transition-colors">
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM ANALYTICS */}
          {activeTab === 'Team Analytics' && (
            <div className={`max-w-7xl mx-auto space-y-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6 flex items-center justify-between gap-4`}>
                <div>
                  <h1 className="text-3xl font-bold">Team Analytics</h1>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Live manager view based on team members, goal sheets, approvals, and goal progress.</p>
                </div>
                <button onClick={fetchTeamAnalytics} className="px-4 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338ca] transition-colors">
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'Active Employees', value: teamAnalytics?.activeEmployees || 0, icon: Users, color: 'text-[#38BDF8]' },
                  { label: 'Team Efficiency', value: `${teamAnalytics?.teamEfficiency || 0}%`, icon: TrendingUp, color: 'text-[#10B981]' },
                  { label: 'Goal Sheets', value: teamAnalytics?.goalSheets || 0, icon: Target, color: 'text-[#FFC107]' },
                  { label: 'Pending Approvals', value: teamAnalytics?.pendingApprovals || 0, icon: AlertTriangle, color: 'text-[#EF4444]' }
                ].map((item) => (
                  <div key={item.label} className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                    <item.icon className={item.color} size={24} />
                    <p className={`text-sm mt-4 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{item.label}</p>
                    <p className="text-3xl font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`xl:col-span-2 ${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                  <h2 className="text-xl font-bold mb-5">Department Performance</h2>
                  <div className="h-[320px] min-h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={teamAnalytics?.departmentPerformance || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e3a5f' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="name" stroke={isDarkMode ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                        <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#0f213d' : '#ffffff', border: `1px solid ${isDarkMode ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '12px' }} />
                        <Bar dataKey="completion" name="Completion %" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="employees" name="Employees" fill="#38BDF8" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                  <h2 className="text-xl font-bold mb-5">Goal Status</h2>
                  <div className="h-[320px] min-h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie data={teamAnalytics?.statusData || [{ name: 'No Goals', value: 1 }]} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={4}>
                          {(teamAnalytics?.statusData || [{ name: 'No Goals', value: 1 }]).map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#0f213d' : '#ffffff', border: `1px solid ${isDarkMode ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '12px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROMOTION BOARD */}
          {activeTab === 'Promotion Board' && (
            <div className={`max-w-7xl mx-auto space-y-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6 flex items-center justify-between gap-4`}>
                <div>
                  <h1 className="text-3xl font-bold">Promotion Board</h1>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>All employees from the database are available for promote or reject decisions.</p>
                </div>
                <button onClick={() => fetchAdminData('Promotion Board')} className="px-4 py-2 rounded-xl bg-[#4F46E5] text-white font-bold hover:bg-[#4338ca] transition-colors">
                  Refresh
                </button>
              </div>

              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px]">
                    <thead className={isDarkMode ? 'bg-[#071426]' : 'bg-slate-50'}>
                      <tr className={isDarkMode ? 'text-gray-300' : 'text-slate-600'}>
                        <th className="p-4 text-left">Employee</th>
                        <th className="p-4 text-left">Department</th>
                        <th className="p-4 text-left">Designation</th>
                        <th className="p-4 text-left">Performance</th>
                        <th className="p-4 text-left">Attendance</th>
                        <th className="p-4 text-left">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr><td colSpan="6" className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>No employees found</td></tr>
                      ) : filteredEmployees.map(employee => (
                        <tr key={employee._id} className={`border-t ${isDarkMode ? 'border-[#1e3a5f]' : 'border-slate-200'}`}>
                          <td className="p-4">
                            <p className="font-bold">{employee.fullName}</p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{employee.empId} - {employee.email}</p>
                          </td>
                          <td className="p-4">{employee.department}</td>
                          <td className="p-4">{employee.designation}</td>
                          <td className={`p-4 font-bold ${employee.performance >= 85 ? 'text-green-400' : employee.performance >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>{employee.performance}%</td>
                          <td className="p-4">{employee.attendance}%</td>
                          <td className="p-4">
                            {promotionActions[employee._id] ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${promotionActions[employee._id] === 'promoted' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {promotionActions[employee._id]}
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handlePromotionDecision(employee._id, 'promoted')} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-bold">
                                  Promote
                                </button>
                                <button onClick={() => handlePromotionDecision(employee._id, 'rejected')} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-bold">
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DEPARTMENTS */}
          {activeTab === 'Departments' && (
            <div className={`max-w-7xl mx-auto space-y-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6 flex items-center justify-between gap-4`}>
                <div>
                  <h1 className="text-3xl font-bold">Company Departments</h1>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>HR admin directory with 15 active departments and database employee counts.</p>
                </div>
                <span className="px-4 py-2 rounded-xl bg-[#10B981]/10 text-[#10B981] font-bold">{filteredDepartments.length} departments</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => (
                  <div key={dept._id} className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#1e3a5f] text-[#38BDF8]' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Building2 size={22} />
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${dept.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{dept.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <h2 className="text-xl font-bold mt-5">{dept.name}</h2>
                    <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                      Managing operations, employee workflows, approvals, and performance visibility.
                    </p>
                    <div className={`mt-5 pt-4 border-t ${isDarkMode ? 'border-[#1e3a5f]' : 'border-slate-200'} flex items-center justify-between`}>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-slate-500'}>Employees</span>
                      <span className="text-2xl font-bold">{dept.employeeCount || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'Audit Logs' && (
            <div className={`max-w-7xl mx-auto space-y-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                <h1 className="text-3xl font-bold">Audit Logs & Escalation Engine</h1>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Promotion decisions, seeded system events, and open escalation records are visible here.</p>
              </div>

              <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Escalation Engine</h2>
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">{escalations.filter(item => !item.isResolved).length} open</span>
                </div>
                <div className="space-y-3">
                  {escalations.length === 0 ? (
                    <p className={isDarkMode ? 'text-gray-400' : 'text-slate-500'}>No escalation records found. The scheduled engine is active and will create records when check-ins are overdue.</p>
                  ) : escalations.map(item => (
                    <div key={item._id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isDarkMode ? 'border-[#1e3a5f] bg-[#071426]/70' : 'border-slate-200 bg-slate-50'}`}>
                      <div>
                        <p className="font-bold">{item.triggerType}</p>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                          Target: {item.targetUser?.fullName || 'Unknown'} - Level {item.level} - {item.isResolved ? 'Resolved' : 'Open'}
                        </p>
                      </div>
                      {!item.isResolved && (
                        <button onClick={() => resolveEscalation(item._id)} className="px-4 py-2 rounded-xl bg-[#10B981] text-white font-bold hover:bg-emerald-600 transition-colors">
                          Resolve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredAuditLogs.length === 0 ? (
                  <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f] text-gray-400' : 'bg-white border-slate-200 text-slate-500'} border rounded-2xl p-6 text-center`}>No audit logs found</div>
                ) : filteredAuditLogs.map((log) => (
                  <div key={log._id} className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-2xl p-5`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#38BDF8]">{log.action}</p>
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                          {log.newValues?.summary || `${log.entityType} updated by ${log.user?.fullName || 'System'}`}
                        </p>
                      </div>
                      <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* COURSE BASICS MODAL */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCourse(null)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f] text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 w-full max-w-xl shadow-2xl relative`}
            >
              <button onClick={() => setSelectedCourse(null)} className={`absolute top-5 right-5 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}><X size={22} /></button>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#1e3a5f] text-[#38BDF8]' : 'bg-indigo-100 text-indigo-600'}`}>
                <BookOpen size={22} />
              </div>
              <h2 className="text-2xl font-bold mt-5">{selectedCourse.title}</h2>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{selectedCourse.duration} - {selectedCourse.level}</p>
              <p className={`mt-5 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>{selectedCourse.brief}</p>
              <div className="mt-6 space-y-3">
                {selectedCourse.basics.map((point) => (
                  <div key={point} className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#071426] border border-[#1e3a5f]' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className="text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f]' : 'bg-white border-slate-200'} border rounded-3xl p-8 w-full max-w-lg shadow-2xl relative`}
            >
              <button onClick={() => setIsSettingsOpen(false)} className={`absolute top-6 right-6 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}><X size={24} /></button>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>User Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 to-transparent border border-[#4F46E5]/20">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#38BDF8] p-[2px]">
                    <div className={`w-full h-full ${isDarkMode ? 'bg-[#071426]' : 'bg-white'} rounded-full flex items-center justify-center`}>
                      <span className="font-bold text-xl text-[#4F46E5]">{user.fullName ? user.fullName.charAt(0) : 'U'}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user.fullName}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-md uppercase">{user.role}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-semibold block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Theme Preference</label>
                    <div className={`flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'border-[#1e3a5f] bg-[#071426]' : 'border-slate-200 bg-slate-50'}`}>
                      <span className="font-medium">Dark Mode</span>
                      <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#4F46E5]' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Notifications</label>
                    <div className={`flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'border-[#1e3a5f] bg-[#071426]' : 'border-slate-200 bg-slate-50'}`}>
                      <span className="font-medium">Email Alerts</span>
                      <button className="w-12 h-6 rounded-full p-1 bg-[#4F46E5] transition-colors">
                        <div className="w-4 h-4 rounded-full bg-white translate-x-6 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={() => { toast.success('Settings Saved!'); setIsSettingsOpen(false); }} className="w-full mt-4 py-3 bg-[#4F46E5] text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
