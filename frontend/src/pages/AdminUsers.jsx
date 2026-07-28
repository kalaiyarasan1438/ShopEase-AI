import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, RefreshCw, Eye, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatDate } from '@utils/formatters';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users?size=100');
      setUsers(res.data.content || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBlockStatus = async (userId, currentlyEnabled, name) => {
    setUpdating(userId);
    try {
      const endpoint = currentlyEnabled ? 'block' : 'unblock';
      const res = await api.put(`/api/admin/users/${userId}/${endpoint}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: res.data.enabled } : u));
      toast.success(`${name} has been ${currentlyEnabled ? 'blocked' : 'unblocked'}.`);
    } catch (err) {
      toast.error(`Failed to update user status`);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter(u => {
    const term = search.toLowerCase();
    return !search || 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">User Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <Users className="text-brand-500" size={24} />
            Users
          </h1>
          <p className="text-[var(--text2)] text-sm mt-1">Manage all registered users and vendors.</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] hover:border-dark-border2 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>
        <button
          onClick={() => setSearch('')}
          className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        >
          Clear search
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">
            All Users ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text3)]">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`border-b border-dark-border last:border-none transition-colors ${!u.enabled ? 'bg-red-500/5' : 'hover:bg-dark-surface2'}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-sm text-[var(--text)]">{u.firstName} {u.lastName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)] max-w-[200px] truncate">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map(role => (
                          <span key={role} className="px-2 py-0.5 rounded bg-dark-surface3 text-xs font-medium text-[var(--text2)]">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border text-green-400 bg-green-500/10 border-green-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border text-red-400 bg-red-500/10 border-red-500/30">
                          Blocked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text3)] whitespace-nowrap">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleBlockStatus(u.id, u.enabled, `${u.firstName} ${u.lastName}`)}
                          disabled={updating === u.id || u.roles?.includes('ADMIN')} // Don't block other admins
                          title={u.enabled ? "Block User" : "Unblock User"}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                            u.enabled 
                              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                              : 'text-green-400 hover:bg-green-500/10 hover:text-green-300'
                          }`}
                        >
                          {u.enabled ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)]">User Details</h2>
              {selectedUser.enabled ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold border text-green-400 bg-green-500/10 border-green-500/30">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold border text-red-400 bg-red-500/10 border-red-500/30">
                  Blocked
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Full Name</div>
                <div className="text-sm font-medium text-[var(--text)]">{selectedUser.firstName} {selectedUser.lastName}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Email</div>
                <div className="text-sm text-[var(--text2)]">{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Phone</div>
                <div className="text-sm text-[var(--text2)]">{selectedUser.phone || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Roles</div>
                <div className="text-sm text-[var(--text2)]">{selectedUser.roles?.join(', ')}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Joined Date</div>
                <div className="text-sm text-[var(--text2)]">
                  {selectedUser.createdAt ? formatDate(selectedUser.createdAt) : '—'}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm font-medium text-[var(--text)] hover:bg-dark-surface3 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
