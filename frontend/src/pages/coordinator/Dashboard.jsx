import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiUsers, FiAlertTriangle, FiCheckCircle,
  FiClock, FiArrowRight, FiSend, FiRefreshCw,
  FiActivity, FiBarChart2, FiZap, FiGrid,
  FiChevronRight, FiBook, FiMapPin, FiTrendingUp
} from 'react-icons/fi';
import { coordinatorAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Dashboard.css';

/* ─── Animated Number ──────────────────────────────── */
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    if (!value) { setDisplay(0); return; }
    let start = 0;
    const end = parseInt(value);
    const inc = end / (1000 / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
};

/* ─── Greeting ─────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/* ─── Progress Ring ────────────────────────────────── */
const ProgressRing = ({ pct, size = 100, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#6366f1';
  return (
    <div className="cd-ring">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="cd-ring__center">
        <span className="cd-ring__pct">{pct}%</span>
        <span className="cd-ring__label">Coverage</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [stats,           setStats]           = useState({
    totalScheduled: 0, publishedSchedules: 0,
    pendingSchedules: 0, totalConflicts: 0,
    totalBatches: 0, batchesWithTimetable: 0
  });
  const [workloadData,    setWorkloadData]    = useState([]);
  const [conflicts,       setConflicts]       = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);

  /* ── fetch ─────────────────────────────────────── */
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [ttRes, wlRes, cfRes, bRes] = await Promise.all([
        coordinatorAPI.getTimetable().catch(() => ({ data: { data: [] } })),
        coordinatorAPI.getAllWorkload().catch(() => ({ data: { data: [] } })),
        coordinatorAPI.getConflicts().catch(() => ({ data: { data: [] } })),
        adminAPI.getBatches().catch(() => ({ data: { data: [] } }))
      ]);

      const tt  = ttRes.data?.data || [];
      const wl  = wlRes.data?.data || [];
      const cf  = cfRes.data?.data || [];
      const bat = bRes.data?.data  || [];

      setStats({
        totalScheduled:       tt.length,
        publishedSchedules:   tt.filter(t => t.isPublished).length,
        pendingSchedules:     tt.filter(t => !t.isPublished).length,
        totalConflicts:       cf.length,
        totalBatches:         bat.length,
        batchesWithTimetable: [...new Set(tt.map(t => t.batch?._id).filter(Boolean))].length
      });
      setWorkloadData(wl.slice(0, 8));
      setConflicts(cf.slice(0, 5));
      setRecentSchedules(tt.slice(0, 5));

      if (silent) toast.success('Dashboard refreshed');
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── computed ───────────────────────────────────── */
  const coveragePct = useMemo(() => {
    if (!stats.totalBatches) return 0;
    return Math.round((stats.batchesWithTimetable / stats.totalBatches) * 100);
  }, [stats]);

  /* ── LOADING ────────────────────────────────────── */
  if (loading) return (
    <div className="cd-loading">
      <div className="cd-loading__spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  /* ── ERROR ──────────────────────────────────────── */
  if (error) return (
    <div className="cd-error">
      <div className="cd-error__icon"><FiAlertTriangle size={36} /></div>
      <h3>Failed to Load</h3>
      <p>{error}</p>
      <button className="cd-btn cd-btn--primary" onClick={() => fetchData()}>
        <FiRefreshCw size={15} /> Retry
      </button>
    </div>
  );

  /* ── RENDER ─────────────────────────────────────── */
  return (
    <div className="cd-dashboard">

      {/* ── Welcome Banner ───────────────────────── */}
      <div className="cd-welcome">
        <div className="cd-welcome__bg" />
        <div className="cd-welcome__content">
          <div className="cd-welcome__left">
            <span className="cd-welcome__greeting">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Coordinator'} 👋
            </span>
            <h2 className="cd-welcome__title">Coordinator Dashboard</h2>
            <p className="cd-welcome__sub">
              Manage timetables, monitor workloads, and resolve scheduling conflicts.
            </p>
            <div className="cd-welcome__actions">
              <Link to="/coordinator/schedule" className="cd-btn cd-btn--white">
                <FiCalendar size={15} /> Schedule Class
              </Link>
              <Link to="/coordinator/publish" className="cd-btn cd-btn--glass">
                <FiSend size={15} /> Publish Timetable
              </Link>
            </div>
          </div>
          <button
            className={`cd-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────── */}
      <div className="cd-stats">
        {[
          {
            icon: FiCalendar,   color: 'blue',
            val: stats.totalScheduled,     label: 'Total Scheduled',
            sub: 'All classes'
          },
          {
            icon: FiCheckCircle, color: 'green',
            val: stats.publishedSchedules, label: 'Published',
            sub: 'Live to students'
          },
          {
            icon: FiClock,      color: 'amber',
            val: stats.pendingSchedules,   label: 'Pending',
            sub: 'Awaiting publish'
          },
          {
            icon: FiAlertTriangle, color: 'red',
            val: stats.totalConflicts,     label: 'Conflicts',
            sub: 'Need resolution'
          }
        ].map((s, i) => (
          <div key={i} className={`cd-stat-card cd-stat-card--${s.color}`}>
            <div className={`cd-stat-card__icon cd-stat-card__icon--${s.color}`}>
              <s.icon size={21} />
            </div>
            <div className="cd-stat-card__body">
              <span className="cd-stat-card__val">
                <AnimatedNumber value={s.val} />
              </span>
              <span className="cd-stat-card__label">{s.label}</span>
              <span className="cd-stat-card__sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ────────────────────────────── */}
      <div className="cd-grid">

        {/* Staff Workload */}
        <div className="cd-card">
          <div className="cd-card__header">
            <div className="cd-card__header-left">
              <FiBarChart2 size={15} className="cd-card__header-icon" />
              <h3>Staff Workload</h3>
            </div>
            <Link to="/coordinator/workload" className="cd-card__link">
              View All <FiArrowRight size={13} />
            </Link>
          </div>
          <div className="cd-card__body">
            {workloadData.length === 0 ? (
              <div className="cd-empty">
                <FiUsers size={28} />
                <p>No workload data available</p>
              </div>
            ) : (
              <div className="cd-workload-list">
                {workloadData.map((staff, i) => {
                  const pct = Math.min(staff.workloadPercentage || 0, 100);
                  const color =
                    staff.status === 'available'     ? '#22c55e' :
                    staff.status === 'moderate'      ? '#f59e0b' :
                    staff.status === 'near-capacity' ? '#ef4444' : '#991b1b';
                  return (
                    <div key={staff._id || i} className="cd-wl-item">
                      <div className="cd-wl-item__avatar">
                        {staff.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="cd-wl-item__info">
                        <span className="cd-wl-item__name">{staff.name}</span>
                        <div className="cd-wl-item__bar-wrap">
                          <div className="cd-wl-item__bar">
                            <div
                              className="cd-wl-item__fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <span className="cd-wl-item__hrs">
                            {staff.currentWorkload || 0}/{staff.maxWorkload || 20}h
                          </span>
                        </div>
                      </div>
                      <span
                        className="cd-wl-item__badge"
                        style={{ background: `${color}18`, color }}
                      >
                        {Math.round(pct)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Conflicts */}
        <div className="cd-card">
          <div className="cd-card__header">
            <div className="cd-card__header-left">
              <FiAlertTriangle size={15} className="cd-card__header-icon" />
              <h3>Active Conflicts</h3>
            </div>
            {conflicts.length > 0 && (
              <span className="cd-badge cd-badge--red">{conflicts.length}</span>
            )}
          </div>
          <div className="cd-card__body">
            {conflicts.length === 0 ? (
              <div className="cd-empty cd-empty--success">
                <FiCheckCircle size={32} />
                <p>No conflicts detected</p>
                <span>All schedules are conflict-free</span>
              </div>
            ) : (
              <div className="cd-conflict-list">
                {conflicts.map((c, i) => (
                  <div key={i} className="cd-conflict-item">
                    <div className="cd-conflict-item__icon">
                      <FiAlertTriangle size={14} />
                    </div>
                    <div className="cd-conflict-item__content">
                      <span className="cd-conflict-item__type">
                        {c.type?.replace('_', ' ')}
                      </span>
                      <span className="cd-conflict-item__detail">
                        {c.entry1?.course} vs {c.entry2?.course}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Schedules */}
        <div className="cd-card">
          <div className="cd-card__header">
            <div className="cd-card__header-left">
              <FiActivity size={15} className="cd-card__header-icon" />
              <h3>Recent Schedules</h3>
            </div>
            <Link to="/coordinator/timetable" className="cd-card__link">
              View All <FiArrowRight size={13} />
            </Link>
          </div>
          <div className="cd-card__body cd-card__body--flush">
            {recentSchedules.length === 0 ? (
              <div className="cd-empty" style={{ padding: '32px' }}>
                <FiCalendar size={28} />
                <p>No schedules yet</p>
                <Link to="/coordinator/schedule" className="cd-btn cd-btn--primary cd-btn--sm">
                  <FiZap size={13} /> Create First Schedule
                </Link>
              </div>
            ) : (
              <div className="cd-schedule-list">
                {recentSchedules.map((s, i) => (
                  <div key={s._id || i} className="cd-schedule-item">
                    <div className="cd-schedule-item__day">
                      <span className="cd-schedule-item__day-name">
                        {s.day?.slice(0, 3)}
                      </span>
                      <span className="cd-schedule-item__time">{s.startTime}</span>
                    </div>
                    <div className="cd-schedule-item__content">
                      <span className="cd-schedule-item__course">
                        {s.course?.courseCode || 'N/A'}
                      </span>
                      <span className="cd-schedule-item__meta">
                        {s.batch?.batchCode || 'N/A'} · {s.hall?.hallCode || 'N/A'}
                      </span>
                    </div>
                    <span className={`cd-status ${s.isPublished ? 'cd-status--pub' : 'cd-status--draft'}`}>
                      {s.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Batch Coverage */}
        <div className="cd-card">
          <div className="cd-card__header">
            <div className="cd-card__header-left">
              <FiGrid size={15} className="cd-card__header-icon" />
              <h3>Batch Coverage</h3>
            </div>
          </div>
          <div className="cd-card__body">
            <div className="cd-coverage">
              <ProgressRing pct={coveragePct} size={110} stroke={9} />
              <div className="cd-coverage__info">
                <p className="cd-coverage__text">
                  <strong>{stats.batchesWithTimetable}</strong> of{' '}
                  <strong>{stats.totalBatches}</strong> batches have timetables
                </p>
                <div className="cd-coverage__items">
                  <div className="cd-coverage__item">
                    <span className="cd-coverage__dot cd-coverage__dot--green" />
                    <span>With timetable: {stats.batchesWithTimetable}</span>
                  </div>
                  <div className="cd-coverage__item">
                    <span className="cd-coverage__dot cd-coverage__dot--gray" />
                    <span>
                      Without: {stats.totalBatches - stats.batchesWithTimetable}
                    </span>
                  </div>
                </div>
                <Link
                  to="/coordinator/schedule"
                  className="cd-btn cd-btn--primary cd-btn--sm"
                  style={{ marginTop: 12 }}
                >
                  Schedule Remaining <FiChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Quick Actions ────────────────────────── */}
      <div className="cd-quick-grid">
        {[
          {
            icon: FiCalendar, color: 'blue',
            label: 'Timetable View',
            desc: 'View full schedule grid',
            to: '/coordinator/timetable'
          },
          {
            icon: FiZap,     color: 'green',
            label: 'Schedule Class',
            desc: 'Add new class session',
            to: '/coordinator/schedule'
          },
          {
            icon: FiBarChart2, color: 'purple',
            label: 'Workload',
            desc: 'Monitor staff workload',
            to: '/coordinator/workload'
          },
          {
            icon: FiSend,    color: 'amber',
            label: 'Publish',
            desc: 'Send timetables to students',
            to: '/coordinator/publish'
          }
        ].map((q, i) => (
          <Link key={i} to={q.to} className={`cd-quick-card cd-quick-card--${q.color}`}>
            <div className={`cd-quick-card__icon cd-quick-card__icon--${q.color}`}>
              <q.icon size={20} />
            </div>
            <div className="cd-quick-card__text">
              <span className="cd-quick-card__label">{q.label}</span>
              <span className="cd-quick-card__desc">{q.desc}</span>
            </div>
            <FiArrowRight size={15} className="cd-quick-card__arrow" />
          </Link>
        ))}
      </div>

    </div>
  );
};

export default CoordinatorDashboard;