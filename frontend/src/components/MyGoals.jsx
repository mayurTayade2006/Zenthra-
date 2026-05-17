import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, CheckCircle, AlertTriangle, Clock, X, Loader2, Save, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyGoals({ isDarkMode = true, searchQuery = '' }) {
  const [goals, setGoals] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  
  // Create Goal State
  const [goalData, setGoalData] = useState({
    title: '', description: '', thrustArea: '', uom: 'Numeric', target: '', weightage: '', deadline: ''
  });

  // Check-In State
  const [checkinData, setCheckinData] = useState({
    quarter: 'Q1', actualAchievement: '', statusUpdate: 'On Track', employeeNotes: ''
  });

  const totalWeightage = goals.reduce((acc, curr) => acc + curr.weightage, 0);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (goals.length >= 3) return toast.error('Maximum of 3 goals allowed.');
    if (parseInt(goalData.weightage) < 10) return toast.error('Minimum weightage is 10%.');
    if (totalWeightage + parseInt(goalData.weightage) > 100) return toast.error(`Total weightage cannot exceed 100%. Current: ${totalWeightage}%`);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(goalData)
      });
      
      if (res.ok) {
        toast.success('Goal created successfully!');
        setIsGoalModalOpen(false);
        setGoalData({ title: '', description: '', thrustArea: '', uom: 'Numeric', target: '', weightage: '', deadline: '' });
        fetchGoals();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to create goal');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/checkins/${activeGoal._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(checkinData)
      });
      
      if (res.ok) {
        toast.success('Quarterly check-in submitted!');
        setIsCheckinModalOpen(false);
        fetchGoals(); // Refresh to get updated progress
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit check-in');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleSubmitSheet = async () => {
  try {

    const token = localStorage.getItem('token');

    const res = await fetch('http://localhost:5000/api/goals/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    console.log(data);

    if (res.ok) {

  toast.success(data.message || 'Goal sheet submitted successfully');

  fetchGoals();

  window.location.reload();

} else {

  toast.error(data.message || 'Failed to submit sheet');

}

  } catch (err) {

    console.error(err);

    toast.error('Server error');
  }
};

  return (
    <div className={`space-y-6 relative ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f]' : 'bg-white border-gray-200'} backdrop-blur-lg p-6 rounded-2xl border flex justify-between items-center transition-colors duration-300`}>
        <div>
          <h2 className="text-2xl font-bold">Goal Sheet (FY 2026)</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className={`text-sm ${totalWeightage === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
              Total Weightage: {totalWeightage}% / 100%
            </span>
            <span className="text-sm text-gray-400">Goals: {goals.length} / 3</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={parseInt(totalWeightage) !== 100 || goals.length !== 3}
            className="px-6 py-2 rounded-xl font-bold bg-[#1e3a5f] text-gray-300 disabled:opacity-50 transition-all hover:bg-[#2d5284]"
            onClick={handleSubmitSheet}
          >
            Submit Sheet
          </button>
          <button disabled={goals.length >= 3}
            onClick={() => setIsGoalModalOpen(true)}
            className="px-6 py-2 rounded-xl font-bold bg-[#4F46E5] text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:bg-[#4338ca] disabled:opacity-50 disabled : cursor not cursor-not-allowed"
          >
            <Plus size={18} /> Add Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {goals.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.thrustArea.toLowerCase().includes(searchQuery.toLowerCase())).map((goal, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            key={goal._id} 
            className={`${isDarkMode ? 'bg-[#0f213d]/60 border-[#1e3a5f] hover:border-[#4F46E5]/50' : 'bg-white border-gray-200 hover:border-[#4F46E5]'} backdrop-blur-lg p-6 rounded-2xl border transition-all`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold px-2 py-1 bg-[#1e3a5f] text-[#38BDF8] rounded-full">{goal.thrustArea}</span>
                <h3 className="text-lg font-bold mt-2">{goal.title}</h3>
                <p className="text-sm text-gray-400">{goal.description}</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{goal.weightage}%</span>
                <p className="text-xs text-gray-400">Weightage</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress ({goal.achieved} / {goal.target} {goal.uom})</span>
                <span className="font-bold text-[#10B981]">{goal.completionPercentage || 0}%</span>
              </div>
              <div className="w-full h-2 bg-[#071426] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-1000" 
                  style={{ width: `${goal.completionPercentage || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-[#1e3a5f] pt-4">
              <div className="flex gap-3">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${goal.status === 'On Track' ? 'bg-green-500/10 text-green-400' : goal.status === 'Not Started' ? 'bg-gray-500/10 text-gray-400' : 'bg-red-500/10 text-red-400'}`}>
                  <CheckCircle size={14} /> {goal.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-[#071426] px-2 py-1 rounded-md border border-[#1e3a5f]">
                  <Clock size={14} /> {new Date(goal.deadline).toLocaleDateString()}
                </span>
              </div>
              <button 
                onClick={() => { setActiveGoal(goal); setIsCheckinModalOpen(true); }}
                className="text-sm font-semibold text-[#FFC107] hover:text-white transition-colors flex items-center gap-1"
              >
                Quarterly Check-In <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f]' : 'bg-white border-gray-200'} border rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative`}
            >
              <button onClick={() => setIsGoalModalOpen(false)} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><X size={20} /></button>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New Goal</h3>
              
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Goal Title</label>
                    <input required type="text" value={goalData.title} onChange={e => setGoalData({...goalData, title: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Description</label>
                    <textarea value={goalData.description} onChange={e => setGoalData({...goalData, description: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5] h-20" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Thrust Area</label>
                    <input required type="text" value={goalData.thrustArea} onChange={e => setGoalData({...goalData, thrustArea: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]" placeholder="e.g. Revenue, Innovation" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Unit of Measurement (UoM)</label>
                    <select value={goalData.uom} onChange={e => setGoalData({...goalData, uom: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]">
                      <option>Numeric</option><option>Percentage</option><option>Timeline</option><option>Zero-based</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Target Value</label>
                    <input required type="number" value={goalData.target} onChange={e => setGoalData({...goalData, target: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Weightage (%) - Min 10%</label>
                    <input required type="number" min="10" max="100" value={goalData.weightage} onChange={e => setGoalData({...goalData, weightage: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">Deadline</label>
                    <input required type="date" value={goalData.deadline} onChange={e => setGoalData({...goalData, deadline: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-6 bg-[#4F46E5] hover:bg-[#4338ca] text-white py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">
                  Save Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quarterly Check-In Modal */}
      <AnimatePresence>
        {isCheckinModalOpen && activeGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`${isDarkMode ? 'bg-[#0f213d] border-[#1e3a5f]' : 'bg-white border-gray-200'} border rounded-2xl p-6 w-full max-w-md shadow-2xl relative`}
            >
              <button onClick={() => setIsCheckinModalOpen(false)} className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><X size={20} /></button>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quarterly Check-In</h3>
              <p className="text-sm text-gray-400 mb-6">Updating: {activeGoal.title}</p>
              
              <form onSubmit={handleCheckin} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Quarter</label>
                  <select value={checkinData.quarter} onChange={e => setCheckinData({...checkinData, quarter: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]">
                    <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Actual Achievement (Target: {activeGoal.target})</label>
                  <input required type="number" value={checkinData.actualAchievement} onChange={e => setCheckinData({...checkinData, actualAchievement: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Status</label>
                  <select value={checkinData.statusUpdate} onChange={e => setCheckinData({...checkinData, statusUpdate: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5]">
                    <option>On Track</option><option>Not Started</option><option>At Risk</option><option>Delayed</option><option>Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Notes / Blockers</label>
                  <textarea required value={checkinData.employeeNotes} onChange={e => setCheckinData({...checkinData, employeeNotes: e.target.value})} className="w-full bg-[#071426] border border-[#1e3a5f] rounded-xl px-4 py-2 text-white focus:border-[#4F46E5] h-20" />
                </div>
                <button type="submit" className="w-full mt-6 bg-[#FFC107] hover:bg-[#e0a800] text-[#071426] py-3 rounded-xl font-bold transition-all">
                  Submit Check-In
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
