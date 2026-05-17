import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Search, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamHub({ isDarkMode = true, searchQuery = '' }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamSheets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://zenthra-dm3x.onrender.com/api/manager/teamsheets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSheets(data);
      } else {
        toast.error('Failed to load team data. Are you logged in as a Manager?');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamSheets();
  }, []);

  const handleAction = async (sheetId, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://zenthra-dm3x.onrender.com/api/manager/teamsheets/${sheetId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, comments: `Manager ${status.toLowerCase()} the sheet.` })
      });
      
      if (res.ok) {
        toast.success(`Goal Sheet ${status}`);
        fetchTeamSheets();
      } else {
        toast.error('Action failed.');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  if (loading) return <div className="text-center text-gray-400 mt-10">Loading Team Data...</div>;

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-gray-200'} backdrop-blur-lg p-6 rounded-2xl border flex justify-between items-center transition-colors duration-300`}>
        <div>
          <h2 className="text-2xl font-bold">Manager Hub: Approvals</h2>
          <p className="text-sm text-gray-400">Review and approve team goals for FY 2026</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search employees..." className={`${isDarkMode ? 'bg-[#071426] border-[#1e3a5f] text-white' : 'bg-gray-100 border-gray-200 text-gray-900'} border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#4F46E5] w-64`} />
        </div>
      </div>

      {sheets.filter(s => s.employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
        <div className={`text-center ${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-gray-200'} p-10 rounded-2xl border`}>
          <ShieldAlert size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Goal Sheets Pending</h3>
          <p className="text-gray-400">Your team has not submitted any goal sheets for approval yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sheets.filter(s => s.employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())).map((sheet, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
              key={sheet._id} 
              className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-gray-200'} backdrop-blur-lg rounded-2xl border overflow-hidden transition-colors duration-300`}
            >
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-[#1e3a5f] bg-[#071426]/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#38BDF8] flex items-center justify-center font-bold text-lg">
                    {sheet.employee?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{sheet.employee?.fullName || 'Unknown Employee'}</h3>
                    <p className="text-sm text-gray-400">ID: {sheet.employee?.empId || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1
                    ${sheet.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : sheet.status === 'Draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' 
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    {sheet.status === 'Approved' ? <CheckCircle2 size={14}/> : <Clock size={14}/>} {sheet.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-4">PROPOSED GOALS ({sheet.goals?.length || 0})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {sheet.goals?.map(g => (
                    <div key={g._id} className={`${isDarkMode ? 'bg-[#071426] border-[#1e3a5f]' : 'bg-gray-50 border-gray-200'} p-4 rounded-xl border`}>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[#38BDF8]">{g.thrustArea}</span>
                        <span className="text-xs font-bold text-gray-400">{g.weightage}% Weight</span>
                      </div>
                      <h5 className="font-bold mt-2">{g.title}</h5>
                      <p className="text-sm text-gray-500 mt-1">Target: {g.target} {g.uom}</p>
                    </div>
                  ))}
                </div>

                {sheet.status !== 'Approved' && (
                  <div className={`flex gap-4 justify-end pt-4 border-t ${isDarkMode ? 'border-[#1e3a5f]' : 'border-gray-200'}`}>
                    <button 
                      onClick={() => handleAction(sheet._id, 'Rework Requested')}
                      className="px-6 py-2 rounded-xl font-bold bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all flex items-center gap-2"
                    >
                      <XCircle size={18} /> Request Rework
                    </button>
                    <button 
                      onClick={() => handleAction(sheet._id, 'Approved')}
                      className="px-6 py-2 rounded-xl font-bold bg-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-[#059669] transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Approve Goals
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
