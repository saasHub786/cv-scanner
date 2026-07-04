import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUsers, FiBriefcase, FiSearch, FiShield, FiUserCheck, FiUserX, FiActivity, FiCalendar, FiTrendingUp, FiCreditCard, FiPlus, FiMinus, FiRefreshCw } from 'react-icons/fi';

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creditUsers, setCreditUsers] = useState([]);
  const [creditsPage, setCreditsPage] = useState(1);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [editModal, setEditModal] = useState(null); // {user, action:'add'|'remove'}

  useEffect(() => { if (tab === 'dashboard') loadDashboard(); }, [tab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.getAdminDashboard();
      if (data.success) setDashboard(data);
    } catch (e) { toast.error('Failed to load dashboard'); } finally { setLoading(false); }
  };

  const loadUsers = async (page = 1) => {
    setLoading(true); setUsersPage(page);
    try {
      const { data } = await api.getAdminUsers({ page, limit: 20 });
      if (data.success) { setUsers(data.users); setUsersTotal(data.total); }
    } catch (e) { toast.error('Failed to load users'); } finally { setLoading(false); }
  };

  const loadCreditUsers = async (page = 1) => {
    setCreditsLoading(true); setCreditsPage(page);
    try {
      const { data } = await api.getAdminCredits({ page, limit: 50 });
      if (data.success) setCreditUsers(data.users || []);
    } catch (e) { toast.error('Failed to load credits'); } finally { setCreditsLoading(false); }
  };

  const handleToggleUser = async (userId) => {
    try { const { data } = await api.toggleUserActive(userId); if (data.success) { toast.success('User status updated'); loadUsers(usersPage); loadDashboard(); } } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try { const { data } = await api.updateUserRole(userId, role); if (data.success) { toast.success('Role updated'); loadUsers(usersPage); } } catch (e) { toast.error('Failed'); }
  };

  const handleAddCredits = async (userId, amount, reason) => {
    try {
      const { data } = await api.adminAddCredits({ userId, amount, reason });
      if (data.success) { toast.success(data.message); setEditModal(null); loadCreditUsers(creditsPage); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleRemoveCredits = async (userId, amount, reason) => {
    try {
      const { data } = await api.adminRemoveCredits({ userId, amount, reason });
      if (data.success) { toast.success(data.message); setEditModal(null); loadCreditUsers(creditsPage); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiActivity },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'credits', label: 'Credits', icon: FiCreditCard },
  ];

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading && !dashboard) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" text="Loading admin panel..." /></div>;

  return (
    <div className="page-container max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <FiShield className="text-primary-600" /><span>Admin Panel</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'users') loadUsers(); if (t.id === 'credits') loadCreditUsers(); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-800'}`}>
            <t.icon /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card"><div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2"><FiUsers className="text-blue-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{dashboard.stats.users.total}</p><p className="text-sm text-gray-500">Total Users ({dashboard.stats.users.active} active)</p></div>
            <div className="card"><div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-2"><FiBriefcase className="text-green-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{dashboard.stats.jobs.totalJobs}</p><p className="text-sm text-gray-500">Total Jobs ({dashboard.stats.jobs.activeJobs} active)</p></div>
            <div className="card"><div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2"><FiSearch className="text-purple-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{dashboard.stats.candidates.totalScans}</p><p className="text-sm text-gray-500">Total CV Scans</p></div>
            <div className="card"><div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2"><FiTrendingUp className="text-orange-600" /></div>
              <p className="text-3xl font-bold text-gray-900">{dashboard.stats.candidates.avgMatchScore}%</p><p className="text-sm text-gray-500">Avg Match Score</p></div>
          </div>
          {dashboard.scanActivity?.length > 0 && (
            <div className="card"><h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2"><FiCalendar /><span>Scan Activity (7 Days)</span></h3>
              <div className="flex items-end space-x-2 h-24">
                {dashboard.scanActivity.map((d, i) => {
                  const h = Math.max(4, (d.count / Math.max(...dashboard.scanActivity.map(x => x.count))) * 100);
                  return <div key={i} className="flex-1 flex flex-col items-center"><span className="text-xs text-gray-500 mb-1">{d.count}</span><div className="w-full bg-primary-500 rounded-t" style={{height:`${h}%`}} /><span className="text-xs text-gray-400 mt-1">{new Date(d.date).toLocaleDateString('en',{weekday:'short'})}</span></div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">All Users ({usersTotal})</h3></div>
          {loading ? <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Company</th><th className="pb-3 font-medium">Scans</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Joined</th><th className="pb-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3"><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></td>
                    <td className="py-3"><select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1"><option value="user">User</option><option value="admin">Admin</option></select></td>
                    <td className="py-3 text-gray-600">{u.company || '-'}</td>
                    <td className="py-3 font-medium">{u.total_scans}</td>
                    <td className="py-3"><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="py-3 text-xs text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="py-3"><button onClick={() => handleToggleUser(u.id)} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>{u.is_active ? <FiUserX /> : <FiUserCheck />}<span>{u.is_active ? 'Deactivate' : 'Activate'}</span></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'credits' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">User Credit Management</h3>
            <button onClick={() => loadCreditUsers(creditsPage)} className="btn-secondary text-sm flex items-center space-x-1">
              <FiRefreshCw /><span>Refresh</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Add or remove credits from any user. 1 credit = 1 CV scan.</p>

          {creditsLoading ? <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Credits</th><th className="pb-3 font-medium">Total Earned</th><th className="pb-3 font-medium">Total Spent</th><th className="pb-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>{creditUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3"><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></td>
                    <td className="py-3"><span className="text-lg font-bold text-primary-600">{u.balance}</span></td>
                    <td className="py-3">{u.total_earned}</td>
                    <td className="py-3">{u.total_spent}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setEditModal({ user: u, action: 'add' })}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                          <FiPlus /><span>Add</span>
                        </button>
                        <button onClick={() => setEditModal({ user: u, action: 'remove' })}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition">
                          <FiMinus /><span>Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Remove Credits Modal */}
      {editModal && (
        <CreditModal
          user={editModal.user}
          action={editModal.action}
          onClose={() => setEditModal(null)}
          onConfirm={editModal.action === 'add' ? handleAddCredits : handleRemoveCredits}
        />
      )}
    </div>
  );
}

function CreditModal({ user, action, onClose, onConfirm }) {
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || amount < 1) { toast.error('Amount must be at least 1'); return; }
    setSubmitting(true);
    await onConfirm(user.id, parseInt(amount), reason || `Admin ${action}: ${amount} credits`);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              {action === 'add' ? <FiPlus className="text-green-500" /> : <FiMinus className="text-red-500" />}
              <span>{action === 'add' ? 'Add Credits' : 'Remove Credits'}</span>
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="text-sm mt-1">Current balance: <span className="font-bold text-primary-600">{user.balance} credits</span></p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
              <input type="number" min={1} max={100000} value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 1)}
                className="input-field text-center text-xl font-bold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input type="text" placeholder={`e.g., ${action === 'add' ? 'Free bonus' : 'Penalty'}`}
                value={reason} onChange={e => setReason(e.target.value)} className="input-field" />
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className={`flex-1 py-2.5 rounded-lg font-medium text-white flex items-center justify-center space-x-2 ${
                  action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {submitting ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Processing...</span></>
                  : <span>{action === 'add' ? `Add ${amount} Credits` : `Remove ${amount} Credits`}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
