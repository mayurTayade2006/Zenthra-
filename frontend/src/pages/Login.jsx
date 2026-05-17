import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo_full.png" alt="Zenthra Logo" className="h-24 object-contain mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ZENTHRA</h1>
          <p className="text-sm text-gray-500 mt-2">Where Atomberg Teams Align, Track, and Achieve.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
              placeholder="employee@company.com"
              required
            />
          </div>


          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="text-xs text-center text-gray-500">Demo Credentials</p>
          <div className="mt-2 flex justify-center space-x-4 text-xs">
            <span className="bg-gray-100 px-2 py-1 rounded">Admin</span>
            <span className="bg-gray-100 px-2 py-1 rounded">Manager</span>
            <span className="bg-gray-100 px-2 py-1 rounded">Employee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
