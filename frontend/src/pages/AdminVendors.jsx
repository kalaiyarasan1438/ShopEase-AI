import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, Search, RefreshCw, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@services/api';
import { formatDate } from '@utils/formatters';

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  color: 'text-amber-400  bg-amber-500/10  border-amber-500/30' },
  APPROVED: { label: 'Approved', color: 'text-green-400  bg-green-500/10  border-green-500/30' },
  REJECTED: { label: 'Rejected', color: 'text-red-400    bg-red-500/10    border-red-500/30' },
  BLOCKED:  { label: 'Blocked',  color: 'text-gray-400   bg-gray-500/10   border-gray-500/30' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {status === 'PENDING'  && '⏳'}
      {status === 'APPROVED' && '✅'}
      {status === 'REJECTED' && '❌'}
      {status === 'BLOCKED'  && '🚫'}
      {cfg.label}
    </span>
  );
}

export default function AdminVendors() {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/vendors?size=100');
      setVendors(res.data.content || []);
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const updateStatus = async (vendorId, action, name) => {
    setUpdating(vendorId);
    try {
      const endpoint = action === 'APPROVED' ? 'approve' : 'reject';
      const res = await api.put(`/api/admin/vendors/${vendorId}/${endpoint}`);
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, currentStatus: res.data.currentStatus } : v));
      toast.success(`${name} has been ${action.toLowerCase()}.`);
    } catch (err) {
      toast.error(`Failed to ${action.toLowerCase()} vendor`);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = vendors.filter(v => {
    const matchSearch = !search || 
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || v.currentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = vendors.reduce((acc, v) => {
    acc[v.currentStatus] = (acc[v.currentStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text3)] mb-2">
            <span>Admin</span><span>/</span>
            <span className="text-[var(--text2)] font-medium">Vendor Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-3">
            <Store className="text-brand-500" size={24} />
            Vendor Management
          </h1>
          <p className="text-[var(--text2)] text-sm mt-1">Approve, reject, or block vendor registrations.</p>
        </div>
        <button
          onClick={fetchVendors}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface2 border border-dark-border rounded-xl text-sm text-[var(--text2)] hover:text-[var(--text)] hover:border-dark-border2 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'].map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setFilterStatus(filterStatus === s ? 'ALL' : s)}
            className={`text-left p-4 rounded-2xl border transition-all ${
              filterStatus === s
                ? 'border-brand-500 bg-brand-500/10'
                : 'bg-dark-surface1 border-dark-border hover:border-dark-border2'
            }`}
          >
            <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">{s}</div>
            <div className="text-2xl font-bold text-[var(--text)]">{counts[s] || 0}</div>
          </motion.button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or company…"
            className="w-full bg-dark-surface2 border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
          />
        </div>
        <button
          onClick={() => { setSearch(''); setFilterStatus('ALL'); }}
          className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border bg-dark-surface2">
          <h3 className="font-semibold text-sm text-[var(--text)]">
            All Vendors ({filtered.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text3)]">
            <Store size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No vendors found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Vendor', 'Email', 'Company', 'Phone', 'Registered', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[var(--text3)] uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, idx) => (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-dark-border last:border-none hover:bg-dark-surface2 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-sm text-[var(--text)]">{v.name}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)] max-w-[160px] truncate">{v.email}</td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text2)]">{v.companyName || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-[var(--text3)]">{v.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text3)] whitespace-nowrap">
                      {v.registrationDate ? formatDate(v.registrationDate) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={v.currentStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {v.currentStatus !== 'APPROVED' && (
                          <button
                            onClick={() => updateStatus(v.id, 'APPROVED', v.name)}
                            disabled={updating === v.id}
                            title="Approve"
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 hover:text-green-300 transition-colors disabled:opacity-40"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {v.currentStatus !== 'REJECTED' && (
                          <button
                            onClick={() => updateStatus(v.id, 'REJECTED', v.name)}
                            disabled={updating === v.id}
                            title="Reject"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-40"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedVendor(v)}
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
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-surface1 border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)]">Vendor Details</h2>
              <StatusBadge status={selectedVendor.currentStatus} />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Name</div>
                <div className="text-sm font-medium text-[var(--text)]">{selectedVendor.name}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Email</div>
                <div className="text-sm text-[var(--text2)]">{selectedVendor.email}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Company Name</div>
                <div className="text-sm text-[var(--text2)]">{selectedVendor.companyName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Phone</div>
                <div className="text-sm text-[var(--text2)]">{selectedVendor.phone || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text3)] uppercase tracking-wider mb-1">Registration Date</div>
                <div className="text-sm text-[var(--text2)]">
                  {selectedVendor.registrationDate ? formatDate(selectedVendor.registrationDate) : '—'}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedVendor(null)}
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
