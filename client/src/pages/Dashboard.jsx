import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    fetchTickets();

    // Listen to real-time events from Express Socket.io backend
    socket.on('ticket_created', (newTicket) => {
      setTickets((prev) => [newTicket, ...prev]);
    });

    socket.on('ticket_updated', (updatedTicket) => {
      setTickets((prev) => prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t)));
    });

    return () => {
      socket.off('ticket_created');
      socket.off('ticket_updated');
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await API.get('/tickets');
      setTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/tickets/${id}`, { status });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Operations Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
        </div>
        <button 
          onClick={logout} 
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm">Total Incidents</p>
          <p className="text-4xl font-extrabold text-blue-400 mt-2">{tickets.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm">Open Tickets</p>
          <p className="text-4xl font-extrabold text-amber-400 mt-2">
            {tickets.filter((t) => t.status === 'OPEN').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-sm">Critical Severity</p>
          <p className="text-4xl font-extrabold text-rose-500 mt-2">
            {tickets.filter((t) => t.severity === 'CRITICAL').length}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">AI Category</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-slate-500">
                  No incident tickets reported yet.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t._id} className="hover:bg-slate-800/50 transition">
                  <td className="p-4 font-semibold">{t.title}</td>
                  <td className="p-4">{t.category}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      t.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                      t.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      t.status === 'RESOLVED' ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {t.status !== 'RESOLVED' && (
                      <button 
                        onClick={() => updateStatus(t._id, 'RESOLVED')} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;