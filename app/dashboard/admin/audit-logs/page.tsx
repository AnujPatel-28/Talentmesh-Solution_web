'use client';

import { useEffect, useState, Fragment } from 'react';
import styles from './audit-logs.module.css';
import { invokeFunction } from '@/lib/insforge';

type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  ip_address: string;
  actor: {
    name: string;
    email: string;
  };
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = async (q = search) => {
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('admin-audit-logs', {
        method: 'GET',
        queries: { search: q, page: '0' }
      });
      if (!error) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      setError('Failed to load audit trails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionClass = (action: string) => {
    if (action.includes('create')) return styles.action_create;
    if (action.includes('update') || action.includes('approve') || action.includes('patch')) return styles.action_update;
    if (action.includes('delete') || action.includes('remove')) return styles.action_delete;
    return '';
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Governance & Oversight</p>
        <h1 className={styles.title}>System Audit Trail</h1>
        <p className={styles.subtitle}>A permanent, immutable record of all administrative interactions and data mutations.</p>
      </header>

      <div className={styles.toolbarRow}>
        <form className={styles.toolbar} onSubmit={e => { e.preventDefault(); fetchLogs(); }}>
          <input 
            className={styles.searchInput} 
            placeholder="Search by action, table, or actor..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className={styles.primaryButton} style={{ background: '#0f172a', padding: '0.75rem 1.5rem', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Filter Logs
          </button>
        </form>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Identifier</th>
              <th>IP Origin</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.emptyState}>Accessing secure audit layer...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyState}>No audit records found matching your query.</td></tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log.id}>
                  <tr 
                    className={styles.rowExpandable} 
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    style={{ background: expandedRow === log.id ? '#f1f5f9' : 'transparent' }}
                  >
                    <td style={{ color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <div className={styles.actorInfo}>
                        <span className={styles.actorName}>{log.actor?.name || 'System Admin'}</span>
                        <span className={styles.actorEmail}>{log.actor?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getActionClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#334155' }}>{log.table_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{log.record_id.slice(0, 8)}...</td>
                    <td style={{ color: '#94a3b8' }}>{log.ip_address || '0.0.0.0'}</td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={6}>
                        <div className={styles.diffContainer}>
                          <div className={styles.diffBox}>
                            <h5>State Before Mutation</h5>
                            <div className={styles.json}>
                              {log.old_data ? JSON.stringify(log.old_data, null, 2) : '// No prior state recorded'}
                            </div>
                          </div>
                          <div className={styles.diffBox}>
                            <h5>State After Mutation</h5>
                            <div className={styles.json}>
                              {log.new_data ? JSON.stringify(log.new_data, null, 2) : '// Record deleted'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
