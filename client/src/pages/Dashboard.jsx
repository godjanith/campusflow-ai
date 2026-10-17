import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import AuroraBackground from '../components/AuroraBackground';

const socket = io('http://localhost:5000');
const COLORS = ['#F43F5E', '#F59E0B', '#10B981', '#3B82F6'];

// Custom Leaflet Pin Marker Icon
const createCustomIcon = (severity) => {
  const color = severity === 'CRITICAL' ? '#F43F5E' : severity === 'HIGH' ? '#F59E0B' : '#3B82F6';
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    fetchTickets();

    socket.on('ticket_created', (newTicket) => {
      setTickets((prev) => [newTicket, ...prev]);
      addAuditLog(`New ${newTicket.severity} incident reported: "${newTicket.title}"`);
    });

    socket.on('ticket_updated', (updatedTicket) => {
      setTickets((prev) => prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t)));
      addAuditLog(`Ticket "${updatedTicket.title}" status updated to ${updatedTicket.status}`);
    });

    return () => {
      socket.off('ticket_created');
      socket.off('ticket_updated');
    };
  }, []);

  const addAuditLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [{ id: Date.now(), message, timestamp }, ...prev.slice(0, 9)]);
  };

  const fetchTickets = async () => {
    try {
      const { data } = await API.get('/tickets');
      setTickets(data);
      addAuditLog(`Fetched ${data.length} active tickets from MongoDB Atlas`);
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

  const severityData = [
    { name: 'Critical', value: tickets.filter((t) => t.severity === 'CRITICAL').length },
    { name: 'High', value: tickets.filter((t) => t.severity === 'HIGH').length },
    { name: 'Medium', value: tickets.filter((t) => t.severity === 'MEDIUM').length },
    { name: 'Low', value: tickets.filter((t) => t.severity === 'LOW').length },
  ];

  const exportCSV = () => {
    const headers = ['Title', 'Category', 'Severity', 'Status', 'CreatedAt\n'];
    const rows = tickets.map((t) => `"${t.title}","${t.category}","${t.severity}","${t.status}","${t.createdAt}"\n`);
    const blob = new Blob([headers.join(','), ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CampusFlow_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Center campus map around Bengaluru coordinates
  const mapCenter = [13.1691, 77.5352];

  return (
    <div className="relative min-h-screen text-slate-100 p-8">
      <AuroraBackground />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Operations Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-blue-400 font-semibold">{user?.name || 'Janith VC'}</span>
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-4 py-2 text-xs text-slate-300">
          <p className="font-semibold text-blue-400 mb-0.5">📱 Campus Support Hotline</p>
          <p>Phone: <span className="text-white font-medium">+91 8971958186</span></p>
          <p>Email: <span className="text-white font-medium">JANITH.20252MCA0318@presidencyuniversity.in</span></p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={exportCSV} 
            className="bg-blue-600/80 hover:bg-blue-500 backdrop-blur-md border border-blue-400/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Export CSV Report
          </button>
          <button 
            onClick={logout} 
            className="bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md border border-slate-700 text-slate-300 text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Total Incidents</p>
          <p className="text-4xl font-extrabold text-blue-400 mt-2">{tickets.length}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Open Tickets</p>
          <p className="text-4xl font-extrabold text-amber-400 mt-2">
            {tickets.filter((t) => t.status === 'OPEN').length}
          </p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Critical Severity</p>
          <p className="text-4xl font-extrabold text-rose-500 mt-2">
            {tickets.filter((t) => t.severity === 'CRITICAL').length}
          </p>
        </div>
      </div>

      {/* Interactive GPS Map & Live Audit Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Interactive GPS Map Widget */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl shadow-xl h-80">
          <h3 className="text-lg font-semibold mb-3 text-slate-200">📍 Live Campus Incident GPS Map</h3>
          <div className="h-60 rounded-lg overflow-hidden border border-slate-700/60">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {tickets.map((t) => (
                <Marker 
                  key={t._id} 
                  position={[t.location?.latitude || 13.1691, t.location?.longitude || 77.5352]}
                  icon={createCustomIcon(t.severity)}
                >
                  <Popup>
                    <div className="text-slate-900 text-xs font-sans">
                      <strong className="block text-sm">{t.title}</strong>
                      <p className="my-1">{t.category} ({t.severity})</p>
                      <span className="text-slate-600">Status: {t.status}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Live Ticket Audit Log Stream */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl shadow-xl h-80 flex flex-col">
          <h3 className="text-lg font-semibold mb-3 text-slate-200">⚡ Live Audit Log Stream</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-slate-500 italic">Listening for live Socket.io events...</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-800/60 border border-slate-700/50 p-2.5 rounded-lg flex justify-between items-start">
                  <span className="text-slate-300 leading-relaxed">{log.message}</span>
                  <span className="text-blue-400 font-semibold ml-2 whitespace-nowrap">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl h-72 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">Incident Severity Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl h-72 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">Incident Volume Analytics</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={severityData}>
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Incident Data Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase">
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
                <tr key={t._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-semibold">{t.title}</td>
                  <td className="p-4">{t.category}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      t.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      t.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded transition shadow-md"
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