import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiBook, FiLayers, FiMapPin,
  FiCalendar, FiTrendingUp, FiTrendingDown, FiClock,
  FiAlertCircle, FiArrowRight, FiRefreshCw,
  FiCheckCircle, FiActivity, FiZap, FiGrid,
  FiPieChart, FiBarChart2, FiStar, FiShield,
  FiWifi, FiDatabase, FiMail, FiServer,
  FiChevronRight, FiPlus, FiEye, FiEdit3,
  FiAward, FiTarget, FiCpu, FiHardDrive
} from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

/* ─── Greeting Helper ──────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Good Night', emoji: '🌙' };
};

/* ─── Format Number ────────────────────────────────── */
const formatNum = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
};

/* ─── Time Ago ─────────────────────────────────────── */
const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* ─── Animated Counter ─────────────────────────────── */
const AnimatedNumber = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const end = parseInt(value);
    const inc = end / (duration / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{formatNum(display)}</span>;
};

/* ─── Stat Card ────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, color, link, change, subtitle }) => {
  const isPositive = change > 0;
  return (
    <Link to={link} className="db-stat-link">
      <div className={`db-stat-card db-stat-card--${color}`}>
        <div className="db-stat-card__accent" />
        <div className="db-stat-card__body">
          <div className={`db-stat-card__icon db-stat-card__icon--${color}`}>
            <Icon size={22} />
          </div>
          <div className="db-stat-card__info">
            <span className="db-stat-card__value">
              <AnimatedNumber value={value} />
            </span>
            <span className="db-stat-card__title">{title}</span>
            {subtitle && (
              <span className="db-stat-card__subtitle">{subtitle}</span>
            )}
          </div>
          <div className="db-stat-card__right">
            {change !== undefined && (
              <span className={`db-stat-card__change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                {isPositive ? '+' : ''}{change}%
              </span>
            )}
            <FiChevronRight className="db-stat-card__arrow" size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Quick Action Card ────────────────────────────── */
const QuickActionCard = ({ label, description, icon: Icon, link, color }) => (
  <Link to={link} className={`db-quick-card db-quick-card--${color}`}>
    <div className={`db-quick-card__icon db-quick-card__icon--${color}`}>
      <Icon size={22} />
    </div>
    <div className="db-quick-card__text">
      <span className="db-quick-card__label">{label}</span>
      <span className="db-quick-card__desc">{description}</span>
    </div>
    <FiArrowRight className="db-quick-card__arrow" size={16} />
  </Link>
);

/* ─── Activity Item ────────────────────────────────── */
const ActivityItem = ({ action, target, time, type, icon: Icon }) => (
  <div className="db-activity-item">
    <div className={`db-activity-item__icon db-activity-item__icon--${type}`}>
      <Icon size={15} />
    </div>
    <div className="db-activity-item__content">
      <span className="db-activity-item__action">{action}</span>
      <span className="db-activity-item__target">{target}</span>
    </div>
    <div className="db-activity-item__time">
      <FiClock size={11} />
      <span>{time}</span>
    </div>
  </div>
);

/* ─── Status Item ──────────────────────────────────── */
const StatusItem = ({ label, status, statusText, icon: Icon }) => (
  <div className="db-status-item">
    <div className="db-status-item__left">
      <Icon size={16} className="db-status-item__icon" />
      <span>{label}</span>
    </div>
    <span className={`db-status-badge db-status-badge--${status}`}>
      <span className={`db-status-dot db-status-dot--${status}`} />
      {statusText}
    </span>
  </div>
);

/* ─── Alert Item ───────────────────────────────────── */
const AlertItem = ({ type, title, description, count }) => (
  <div className={`db-alert-item db-alert-item--${type}`}>
    <div className={`db-alert-item__icon db-alert-item__icon--${type}`}>
      <FiAlertCircle size={18} />
    </div>
    <div className="db-alert-item__content">
      <div className="db-alert-item__header">
        <span className="db-alert-item__title">{title}</span>
        {count && (
          <span className={`db-alert-item__count db-alert-item__count--${type}`}>
            {count}
          </span>
        )}
      </div>
      <span className="db-alert-item__desc">{description}</span>
    </div>
  </div>
);

/* ─── Distribution Bar ─────────────────────────────── */
const DistributionBar = ({ items }) => {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="db-dist">
      <div className="db-dist__bar">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`db-dist__segment db-dist__segment--${item.color}`}
            style={{ width: `${total ? (item.value / total) * 100 : 0}%` }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>
      <div className="db-dist__legend">
        {items.map((item, idx) => (
          <div key={idx} className="db-dist__legend-item">
            <span className={`db-dist__legend-dot db-dist__legend-dot--${item.color}`} />
            <span className="db-dist__legend-label">{item.label}</span>
            <span className="db-dist__legend-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Progress Ring ────────────────────────────────── */
const ProgressRing = ({ percentage, label, color = 'primary', size = 80 }) => {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = radius * 2 * Math.PI;
  const offset = circ - (percentage / 100) * circ;

  return (
    <div className="db-ring">
      <svg width={size} height={size} className="db-ring__svg">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e2e8f0" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          className={`db-ring__progress db-ring__progress--${color}`}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="db-ring__text">
        <span className="db-ring__pct">{percentage}%</span>
        <span className="db-ring__label">{label}</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const greeting = useMemo(() => getGreeting(), []);

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  /* fetch data */
  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [staffRes, batchRes, courseRes, hallRes] = await Promise.all([
        adminAPI.getStaff({ limit: 1 }),
        adminAPI.getBatches(),
        adminAPI.getCourses(),
        adminAPI.getHalls()
      ]);

      const batchData = batchRes.data.data || [];
      const courseData = courseRes.data.data || [];
      const hallData = hallRes.data.data || [];

      setStats({
        totalStaff: staffRes.data.total || 0,
        totalBatches: batchData.length,
        totalCourses: courseData.length,
        totalHalls: hallData.length,
        weekdayBatches: batchData.filter(b => b.type === 'WD').length,
        weekendBatches: batchData.filter(b => b.type === 'WE').length,
        totalStudents: batchData.reduce((s, b) => s + (b.studentCount || 0), 0),
        lectureHalls: hallData.filter(h => h.type === 'Lecture Hall').length,
        labs: hallData.filter(h => h.type === 'Lab').length,
        tutorialRooms: hallData.filter(h => h.type === 'Tutorial Room').length,
        recentBatches: batchData.slice(-3).reverse(),
        recentCourses: courseData.slice(-3).reverse()
      });

      if (silent) toast.success('Dashboard refreshed');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
      if (silent) toast.error('Refresh failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* computed */
  const completionPct = useMemo(() => {
    if (!stats) return 0;
    let score = 0;
    if (stats.totalStaff > 0) score += 25;
    if (stats.totalBatches > 0) score += 25;
    if (stats.totalCourses > 0) score += 25;
    if (stats.totalHalls > 0) score += 25;
    return score;
  }, [stats]);

  const hallDistribution = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Lecture Halls', value: stats.lectureHalls, color: 'primary' },
      { label: 'Labs', value: stats.labs, color: 'success' },
      { label: 'Tutorial Rooms', value: stats.tutorialRooms, color: 'warning' }
    ];
  }, [stats]);

  const batchDistribution = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Weekday', value: stats.weekdayBatches, color: 'success' },
      { label: 'Weekend', value: stats.weekendBatches, color: 'warning' }
    ];
  }, [stats]);

  /* activities */
  const activities = useMemo(() => {
    if (!stats) return [];
    const list = [];
    stats.recentBatches?.forEach(b => {
      list.push({
        action: 'Batch created',
        target: b.batchCode,
        time: b.createdAt ? timeAgo(b.createdAt) : 'Recently',
        type: 'batch',
        icon: FiLayers
      });
    });
    stats.recentCourses?.forEach(c => {
      list.push({
        action: 'Course added',
        target: `${c.courseCode} - ${c.courseName}`,
        time: c.createdAt ? timeAgo(c.createdAt) : 'Recently',
        type: 'course',
        icon: FiBook
      });
    });
    if (list.length === 0) {
      list.push({
        action: 'System started',
        target: 'Dashboard ready',
        time: 'Just now',
        type: 'system',
        icon: FiCheckCircle
      });
    }
    return list.slice(0, 6);
  }, [stats]);

  /* alerts */
  const alerts = useMemo(() => {
    if (!stats) return [];
    const a = [];
    if (stats.totalStaff === 0) {
      a.push({
        type: 'error',
        title: 'No Staff Added',
        description: 'Upload staff members to get started',
        count: '!'
      });
    }
    if (stats.totalBatches === 0) {
      a.push({
        type: 'warning',
        title: 'No Batches Created',
        description: 'Create batches for scheduling',
        count: '!'
      });
    }
    if (stats.totalCourses === 0) {
      a.push({
        type: 'warning',
        title: 'No Courses Added',
        description: 'Add courses to assign instructors',
        count: '!'
      });
    }
    if (stats.totalHalls === 0) {
      a.push({
        type: 'info',
        title: 'No Halls Configured',
        description: 'Add lecture halls and labs',
        count: '!'
      });
    }
    if (completionPct === 100) {
      a.push({
        type: 'success',
        title: 'System Ready',
        description: 'All modules configured. Ready for timetable generation!',
        count: '✓'
      });
    }
    return a;
  }, [stats, completionPct]);

  /* ── Loading ───────────────────────────── */
  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-loading__spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  /* ── Error ─────────────────────────────── */
  if (error) {
    return (
      <div className="db-error">
        <div className="db-error__icon">
          <FiAlertCircle size={40} />
        </div>
        <h3>Failed to Load Dashboard</h3>
        <p>{error}</p>
        <button className="db-error__btn" onClick={() => fetchData()}>
          <FiRefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  /* ── RENDER ────────────────────────────── */
  return (
    <div className="db-dashboard">

      {/* ── Welcome Banner ─────────────────── */}
      <div className="db-welcome">
        <div className="db-welcome__bg" />
        <div className="db-welcome__content">
          <div className="db-welcome__left">
            <span className="db-welcome__greeting">
              {greeting.emoji} {greeting.text}
            </span>
            <h2 className="db-welcome__title">Welcome back, Admin!</h2>
            <p className="db-welcome__sub">
              Here's an overview of your timetable management system.
            </p>
            <div className="db-welcome__meta">
              <span>
                <FiCalendar size={13} />
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </span>
              <span>
                <FiClock size={13} />
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          <div className="db-welcome__right">
            <button
              className={`db-welcome__refresh ${refreshing ? 'spinning' : ''}`}
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Refresh"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────── */}
      <div className="db-stats-grid">
        <StatCard
          title="Total Staff"
          value={stats.totalStaff}
          icon={FiUsers}
          color="primary"
          link="/admin/staff"
          change={12}
          subtitle="Active instructors"
        />
        <StatCard
          title="Active Batches"
          value={stats.totalBatches}
          icon={FiLayers}
          color="success"
          link="/admin/batches"
          change={5}
          subtitle={`${stats.totalStudents} students`}
        />
        <StatCard
          title="Courses"
          value={stats.totalCourses}
          icon={FiBook}
          color="warning"
          link="/admin/courses"
          change={8}
          subtitle="Registered modules"
        />
        <StatCard
          title="Halls & Labs"
          value={stats.totalHalls}
          icon={FiMapPin}
          color="error"
          link="/admin/halls"
          change={2}
          subtitle="Available venues"
        />
      </div>

      {/* ── Main Grid ──────────────────────── */}
      <div className="db-main-grid">

        {/* LEFT COLUMN */}
        <div className="db-main-col">

          {/* Quick Actions */}
          <div className="db-card">
            <div className="db-card__header">
              <div className="db-card__header-left">
                <FiZap size={16} className="db-card__header-icon" />
                <h3>Quick Actions</h3>
              </div>
            </div>
            <div className="db-card__body">
              <div className="db-quick-grid">
                <QuickActionCard
                  label="Add Staff"
                  description="Upload or create new staff members"
                  icon={FiUsers}
                  link="/admin/staff"
                  color="primary"
                />
                <QuickActionCard
                  label="Create Batch"
                  description="Set up new student batches"
                  icon={FiLayers}
                  link="/admin/batches"
                  color="success"
                />
                <QuickActionCard
                  label="Add Course"
                  description="Register new course modules"
                  icon={FiBook}
                  link="/admin/courses"
                  color="warning"
                />
                <QuickActionCard
                  label="Add Hall"
                  description="Configure halls and labs"
                  icon={FiMapPin}
                  link="/admin/halls"
                  color="error"
                />
              </div>
            </div>
          </div>

          {/* Batch Distribution */}
          <div className="db-card">
            <div className="db-card__header">
              <div className="db-card__header-left">
                <FiBarChart2 size={16} className="db-card__header-icon" />
                <h3>Batch Distribution</h3>
              </div>
              <Link to="/admin/batches" className="db-card__header-link">
                View All <FiArrowRight size={13} />
              </Link>
            </div>
            <div className="db-card__body">
              <div className="db-dist-stats">
                <div className="db-dist-stat">
                  <span className="db-dist-stat__value">{stats.weekdayBatches}</span>
                  <span className="db-dist-stat__label">Weekday</span>
                </div>
                <div className="db-dist-stat">
                  <span className="db-dist-stat__value">{stats.weekendBatches}</span>
                  <span className="db-dist-stat__label">Weekend</span>
                </div>
                <div className="db-dist-stat">
                  <span className="db-dist-stat__value">{formatNum(stats.totalStudents)}</span>
                  <span className="db-dist-stat__label">Students</span>
                </div>
              </div>
              <DistributionBar items={batchDistribution} />
            </div>
          </div>

          {/* Hall Distribution */}
          <div className="db-card">
            <div className="db-card__header">
              <div className="db-card__header-left">
                <FiPieChart size={16} className="db-card__header-icon" />
                <h3>Venue Distribution</h3>
              </div>
              <Link to="/admin/halls" className="db-card__header-link">
                View All <FiArrowRight size={13} />
              </Link>
            </div>
            <div className="db-card__body">
              <DistributionBar items={hallDistribution} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="db-main-col">

          {/* System Readiness */}
          <div className="db-card">
            <div className="db-card__header">
              <div className="db-card__header-left">
                <FiTarget size={16} className="db-card__header-icon" />
                <h3>System Readiness</h3>
              </div>
            </div>
            <div className="db-card__body db-readiness">
              <ProgressRing
                percentage={completionPct}
                label="Setup"
                color={completionPct === 100 ? 'success' : 'primary'}
                size={90}
              />
              <div className="db-readiness__checklist">
                {[
                  { label: 'Staff Members', done: stats.totalStaff > 0, link: '/admin/staff' },
                  { label: 'Batches', done: stats.totalBatches > 0, link: '/admin/batches' },
                  { label: 'Courses', done: stats.totalCourses > 0, link: '/admin/courses' },
                  { label: 'Halls / Labs', done: stats.totalHalls > 0, link: '/admin/halls' }
                ].map((item, i) => (
                  <Link key={i} to={item.link} className="db-checklist-item">
                    <span className={`db-checklist-icon ${item.done ? 'done' : ''}`}>
                      {item.done ? <FiCheckCircle size={14} /> : <FiPlus size={14} />}
                    </span>
                    <span className={`db-checklist-label ${item.done ? 'done' : ''}`}>
                      {item.label}
                    </span>
                    <FiChevronRight size={14} className="db-checklist-arrow" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="db-card">
            <div className="db-card__header">
              <div className="db-card__header-left">
                <FiActivity size={16} className="db-card__header-icon" />
                <h3>Recent Activity</h3>
              </div>
              <span className="db-card__header-badge">{activities.length}</span>
            </div>
            <div className="db-card__body db-card__body--flush">
              <div className="db-activity-list">
                {activities.map((a, i) => (
                  <ActivityItem key={i} {...a} />
                ))}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="db-card">
            <div className="db-card__header">
              <div className="db-card__header-left">
                <FiShield size={16} className="db-card__header-icon" />
                <h3>System Status</h3>
              </div>
            </div>
            <div className="db-card__body">
              <div className="db-status-list">
                <StatusItem
                  label="Database"
                  status="success"
                  statusText="Healthy"
                  icon={FiDatabase}
                />
                <StatusItem
                  label="API Server"
                  status="success"
                  statusText="Running"
                  icon={FiServer}
                />
                <StatusItem
                  label="Email Service"
                  status="success"
                  statusText="Active"
                  icon={FiMail}
                />
                <StatusItem
                  label="Connection"
                  status="success"
                  statusText="Stable"
                  icon={FiWifi}
                />
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="db-card">
              <div className="db-card__header">
                <div className="db-card__header-left">
                  <FiAlertCircle size={16} className="db-card__header-icon" />
                  <h3>Alerts</h3>
                </div>
                <span className="db-card__header-badge db-card__header-badge--alert">
                  {alerts.length}
                </span>
              </div>
              <div className="db-card__body">
                <div className="db-alerts-list">
                  {alerts.map((a, i) => (
                    <AlertItem key={i} {...a} />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;