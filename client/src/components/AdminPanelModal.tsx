import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Radio, AlertTriangle, X, CheckCircle2, 
  Search, RefreshCw, Server, Send, Award, Activity, Database, Lock
} from 'lucide-react';
import { CurrentUser, AdminMetrics, GroundStation } from '../types';
import { 
  fetchAdminMetrics, fetchAdminUsers, updateAdminUser, 
  broadcastEmergencyAlert, fetchGroundStations, fetchAuditLogs 
} from '../services/api';
import { sounds } from '../services/soundEffects';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'users' | 'broadcast' | 'stations' | 'audit'>('kpi');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [groundStations, setGroundStations] = useState<GroundStation[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Broadcast state
  const [alertTitle, setAlertTitle] = useState('Severe Cyclonic Alert - High Wind Speed');
  const [alertMessage, setAlertMessage] = useState('All field units advised to maintain satellite radio watch on NavIC Channel 16. Optical fiber lines may be disrupted.');
  const [alertSeverity, setAlertSeverity] = useState('CRITICAL CODE RED');
  const [alertArea, setAlertArea] = useState('Coastal Andhra Pradesh & Odisha');
  const [isConfirmingBroadcast, setIsConfirmingBroadcast] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const [m, u, g, logsRes] = await Promise.all([
        fetchAdminMetrics().catch((err) => {
          console.warn('Metrics fetch error', err);
          return null;
        }),
        fetchAdminUsers().catch((err) => {
          console.warn('Users fetch error', err);
          return [];
        }),
        fetchGroundStations().catch(() => []),
        fetchAuditLogs().catch(() => ({ success: false, logs: [] }))
      ]);

      if (m) setMetrics(m);
      if (u) setUsers(u);
      if (g) setGroundStations(g);
      if (logsRes && logsRes.logs) setAuditLogs(logsRes.logs);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load administrative telemetry' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleVerify = async (user: CurrentUser) => {
    try {
      const res = await updateAdminUser(user.id, {
        verifiedBharat: !user.verifiedBharat
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      sounds.playSentSound();
      setStatusMessage({ type: 'success', text: `Updated verification for @${user.nexusId}` });
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Action rejected' });
    }
  };

  const handleRoleChange = async (user: CurrentUser, newRole: string) => {
    // Prevent self-demotion
    if (user.id === currentUser?.id) {
      alert('Security Protection: Self-demotion is restricted to prevent permanent lockout from the terminal.');
      return;
    }

    try {
      const res = await updateAdminUser(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      sounds.playSentSound();
      setStatusMessage({ type: 'success', text: `Updated role for @${user.nexusId} to ${newRole}` });
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Failed to update user role' });
    }
  };

  const handleToggleSatelliteAccess = async (user: CurrentUser) => {
    try {
      const res = await updateAdminUser(user.id, {
        satelliteAccess: !user.satelliteAccess
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      sounds.playSatelliteChirp();
      setStatusMessage({ type: 'success', text: `Toggled satellite access for @${user.nexusId}` });
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Action rejected' });
    }
  };

  const handleRequestBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;
    setIsConfirmingBroadcast(true);
  };

  const handleExecuteBroadcast = async () => {
    setIsBroadcasting(true);
    sounds.playSosAlert();
    try {
      await broadcastEmergencyAlert({
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        area: alertArea
      });
      setIsConfirmingBroadcast(false);
      setStatusMessage({ type: 'success', text: 'Emergency alert dispatched to all active terminals!' });
      loadData();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to broadcast alert' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nexusId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-surface dark:bg-[#0b121c] text-on-surface border border-emerald-500/40 rounded-2xl sm:rounded-3xl w-full max-w-[390px] h-[92dvh] flex flex-col overflow-hidden shadow-2xl emerald-glow">
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-surface-container-low dark:bg-[#0e1724] border-b border-surface-container-highest dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="font-bold text-sm sm:text-base text-on-surface dark:text-white">
                  Nexus Sovereign Network Administration
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Command Center
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Logged in as <span className="text-emerald-300 font-bold">{currentUser?.name}</span> ({currentUser?.role?.toUpperCase()})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={loadData}
              title="Refresh Telemetry"
              className="p-1.5 sm:p-2 rounded-xl text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs flex items-center justify-between ${
            statusMessage.type === 'error' ? 'bg-error-container/80 text-error' : 'bg-emerald-950/80 text-emerald-300'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-3.5 sm:px-6 pt-2 bg-surface-container-lowest dark:bg-[#0d1522] border-b border-surface-container-highest dark:border-slate-800 flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
          {[
            { id: 'kpi', label: 'Network KPI Radar', icon: Activity },
            { id: 'users', label: 'Sovereign Users Directory', icon: Users },
            { id: 'broadcast', label: 'Emergency Alerts', icon: AlertTriangle },
            { id: 'stations', label: 'NavIC Ground Stations', icon: Server },
            { id: 'audit', label: 'Audit Security Logs', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setStatusMessage(null);
                }}
                className={`py-3 px-2 sm:px-3 flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: KPI RADAR */}
          {activeTab === 'kpi' && metrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-[#0f1726] border border-surface-container-highest dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Total Verified Nodes</span>
                  <p className="text-2xl font-bold text-white font-mono">{metrics.totalUsers}</p>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Cryptographic Identity</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-[#0f1726] border border-surface-container-highest dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Active Nodes</span>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{metrics.activeUsers}</p>
                  <span className="text-[10px] text-emerald-400 font-mono">Authenticated Sessions</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-[#0f1726] border border-surface-container-highest dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Dispatched Envelopes</span>
                  <p className="text-2xl font-bold text-sky-400 font-mono">{metrics.totalMessages}</p>
                  <span className="text-[10px] text-slate-400 font-mono">{metrics.satelliteMessages} Satellite Burst</span>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-[#0f1726] border border-surface-container-highest dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Ground Relays</span>
                  <p className="text-2xl font-bold text-emerald-400 font-mono">{metrics.groundStationsOnline} / 6</p>
                  <span className="text-[10px] text-emerald-400 font-mono">ISRO Space Segment Sync</span>
                </div>
              </div>

              {/* Architecture Health Pill */}
              <div className="p-4 rounded-2xl bg-[#0e1828] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>Sovereign Storage Architecture</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atomic transaction writes enabled with zero cross-border metadata forwarding.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    State: {metrics.complianceStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CITIZENS & OFFICERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, unique Nexus ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#111927] text-xs text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono shrink-0">
                  Showing {filteredUsers.length} Users
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-surface-container-lowest dark:bg-[#0c131f]">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-surface-container-low dark:bg-[#101928] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">User / Avatar</th>
                      <th className="p-3.5">Nexus ID</th>
                      <th className="p-3.5">Mobile Station</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Verified</th>
                      <th className="p-3.5">Satellite Uplink</th>
                      <th className="p-3.5">Jurisdiction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 flex items-center space-x-2.5">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{user.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{user.status}</p>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                            @{user.nexusId}
                          </td>

                          <td className="p-3.5 text-slate-300 font-mono">
                            {user.phone}
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center space-x-1.5">
                              <select
                                value={user.role}
                                disabled={isSelf}
                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none ${
                                  isSelf
                                    ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed opacity-80'
                                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                                }`}
                                title={isSelf ? 'Own admin role locked to prevent accidental lockout' : 'Change user role'}
                              >
                                <option value="admin">Admin</option>
                                <option value="officer">Officer</option>
                                <option value="citizen">Citizen</option>
                                <option value="suspended">Suspended</option>
                              </select>
                              {isSelf && (
                                <span title="Self-demotion protection">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleVerify(user)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center space-x-1 ${
                                user.verifiedBharat
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Award className="w-3 h-3 mr-0.5" />
                              <span>{user.verifiedBharat ? 'Verified' : 'Unverified'}</span>
                            </button>
                          </td>

                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleSatelliteAccess(user)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center space-x-1 ${
                                user.satelliteAccess
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Radio className="w-3 h-3 mr-0.5" />
                              <span>{user.satelliteAccess ? 'Granted' : 'Revoked'}</span>
                            </button>
                          </td>

                          <td className="p-3.5 text-slate-400">
                            {user.state || 'National'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: NATIONAL EMERGENCY BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="w-full space-y-6">
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl">
                <h3 className="font-bold text-sm text-rose-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Sovereign Emergency Alert Broadcast Center</span>
                </h3>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  Requires Server-Side RBAC Admin privileges. Broadcasts dispatched here will be beamed across all high-speed and satellite frequencies to every connected citizen and rescue officer immediately.
                </p>
              </div>

              <form onSubmit={handleRequestBroadcast} className="space-y-4 bg-[#0f1726] p-6 rounded-2xl border border-slate-800 shadow-md">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Alert Severity Level
                  </label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value)}
                    className="w-full bg-[#141d2d] text-xs font-bold text-white px-3 py-2.5 rounded-xl border border-slate-700"
                  >
                    <option value="CRITICAL CODE RED">CRITICAL CODE RED (Immediate Danger / Natural Disaster)</option>
                    <option value="ORANGE ALERT">ORANGE ALERT (Severe Meteorological / Defense Caution)</option>
                    <option value="YELLOW NOTICE">YELLOW NOTICE (Advisory / Channel Frequency Update)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Alert Headline
                  </label>
                  <input
                    type="text"
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    required
                    className="w-full bg-[#141d2d] text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Geographical Area
                  </label>
                  <input
                    type="text"
                    value={alertArea}
                    onChange={(e) => setAlertArea(e.target.value)}
                    required
                    className="w-full bg-[#141d2d] text-xs text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Detailed Advisory &amp; Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    required
                    className="w-full bg-[#141d2d] text-xs text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-rose-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Prepare Broadcast...</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: ISRO NAVIC GROUND STATIONS */}
          {activeTab === 'stations' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white">
                Sovereign Satellite Tracking &amp; Telemetry Ground Infrastructure
              </h3>
              <div className="flex flex-col gap-3">
                {groundStations.map((station) => (
                  <div key={station.id} className="p-4 rounded-2xl bg-surface-container-low dark:bg-[#0f1726] border border-surface-container-highest dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <h4 className="font-bold text-sm text-white">{station.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{station.location}</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">ID: {station.id}</p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                        {station.status}
                      </span>
                      <p className="text-xs text-slate-400 font-mono mt-1">Load: {station.load}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Security Event Audit Trail</h3>
                  <p className="text-xs text-slate-400">Append-only log of security-sensitive operations and authentication events</p>
                </div>
                <span className="text-xs font-mono text-emerald-400">{auditLogs.length} events logged</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-surface-container-lowest dark:bg-[#0c131f] overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-surface-container-low dark:bg-[#101928] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Timestamp (UTC)</th>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Client IP</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                          No audit logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-3 font-semibold text-emerald-400">{log.type}</td>
                          <td className="p-3 text-slate-300">{log.actorId || 'system'}</td>
                          <td className="p-3 text-slate-400">{log.ip || '127.0.0.1'}</td>
                          <td className="p-3 text-slate-300 font-sans text-xs">
                            {JSON.stringify(log.details || {})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-surface-container-low dark:bg-[#0e1724] border-t border-surface-container-highest dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Sovereign RBAC Protected • Role: {currentUser?.role}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Admin Console
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Emergency Broadcast */}
      {isConfirmingBroadcast && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
          <div className="bg-[#121c2d] border border-rose-500/60 rounded-2xl p-6 max-w-[390px] w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="font-bold text-base text-white">Confirm Emergency Broadcast</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to broadcast this emergency alert to <span className="text-white font-bold">{alertArea}</span>?
              This will override active radio channels on all receiving terminals.
            </p>

            <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-rose-400">{alertSeverity}: {alertTitle}</p>
              <p className="text-slate-400 text-[11px] line-clamp-2">{alertMessage}</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingBroadcast(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={handleExecuteBroadcast}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-rose-900/50"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
