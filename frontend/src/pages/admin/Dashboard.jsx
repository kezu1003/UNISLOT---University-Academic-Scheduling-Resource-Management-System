import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiBook, FiLayers, FiMapPin, 
  FiCalendar, FiTrendingUp, FiClock, FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { adminAPI } from '../../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all stats in parallel
      const [staffRes, batchRes, courseRes, hallRes] = await Promise.all([
        adminAPI.getStaff({ limit: 1 }),
        adminAPI.getBatches(),
        adminAPI.getCourses(),
        adminAPI.getHalls()
      ]);

      setStats({
        totalStaff: staffRes.data.total || 0,
        totalBatches: batchRes.data.data?.length || 0,
        totalCourses: courseRes.data.data?.length || 0,
        totalHalls: hallRes.data.data?.length || 0
      });

      // Mock recent activities (in production, fetch from API)
      setRecentActivities([
        { id: 1, action: 'New staff added', target: 'Dr. John Smith', time: '5 min ago', type: 'staff' },
        { id: 2, action: 'Batch created', target: 'Y2.S1.WD.IT.03.01', time: '1 hour ago', type: 'batch' },
        { id: 3, action: 'Course updated', target: 'IT2030 - Data Structures', time: '2 hours ago', type: 'course' },
        { id: 4, action: 'Hall added', target: 'A501 - Lecture Hall', time: '3 hours ago', type: 'hall' },
        { id: 5, action: 'Staff priority changed', target: 'Ms. Jane Doe', time: '5 hours ago', type: 'staff' }
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { 
      title: 'Total Staff', 
      value: stats?.totalStaff || 0, 
      icon: FiUsers, 
      color: 'primary',
      link: '/admin/staff',
      change: '+12%'
    },
    { 
      title: 'Active Batches', 
      value: stats?.totalBatches || 0, 
      icon: FiLayers, 
      color: 'success',
      link: '/admin/batches',
      change: '+5%'
    },
    { 
      title: 'Courses', 
      value: stats?.totalCourses || 0, 
      icon: FiBook, 
      color: 'warning',
      link: '/admin/courses',
      change: '+8%'
    },
    { 
      title: 'Halls', 
      value: stats?.totalHalls || 0, 
      icon: FiMapPin, 
      color: 'error',
      link: '/admin/halls',
      change: '+2%'
    }
  ];

  const quickActions = [
    { label: 'Add Staff', icon: FiUsers, link: '/admin/staff', color: 'primary' },
    { label: 'Create Batch', icon: FiLayers, link: '/admin/batches', color: 'success' },
    { label: 'Add Course', icon: FiBook, link: '/admin/courses', color: 'warning' },
    { label: 'Add Hall', icon: FiMapPin, link: '/admin/halls', color: 'error' }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loading text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <FiAlertCircle size={48} />
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <Button variant="primary" onClick={fetchDashboardData}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome back, Admin! 👋</h2>
          <p>Here's what's happening with your timetable system today.</p>
        </div>
        <div className="welcome-actions">
          <Link to="/admin/timetable">
            <Button variant="outline" className="welcome-btn">
              <FiCalendar />
              <span>View Timetable</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Link to={stat.link} key={index} className="stats-card-link">
              <div className={`stats-card stats-card-${stat.color}`}>
                <div className={`stats-icon ${stat.color}`}>
                  <IconComponent size={24} />
                </div>
                <div className="stats-content">
                  <p className="stats-value">{stat.value}</p>
                  <p className="stats-label">{stat.title}</p>
                </div>
                <div className={`stats-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  <FiTrendingUp size={14} />
                  <span>{stat.change}</span>
                </div>
                <div className="stats-arrow">
                  <FiArrowRight size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <Card className="dashboard-card">
          <CardHeader className="card-header-flex">
            <h3>Quick Actions</h3>
          </CardHeader>
          <CardBody>
            <div className="quick-actions">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Link to={action.link} key={index} className={`quick-action ${action.color}`}>
                    <div className="quick-action-icon">
                      <IconComponent size={24} />
                    </div>
                    <span>{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="dashboard-card">
          <CardHeader className="card-header-flex">
            <h3>Recent Activity</h3>
            <Link to="/admin/activity" className="view-all-link">
              View All
              <FiArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardBody className="no-padding">
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}>
                      {activity.type === 'staff' && <FiUsers size={16} />}
                      {activity.type === 'batch' && <FiLayers size={16} />}
                      {activity.type === 'course' && <FiBook size={16} />}
                      {activity.type === 'hall' && <FiMapPin size={16} />}
                    </div>
                    <div className="activity-content">
                      <p className="activity-action">{activity.action}</p>
                      <p className="activity-target">{activity.target}</p>
                    </div>
                    <div className="activity-time">
                      <FiClock size={12} />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* System Status */}
        <Card className="dashboard-card">
          <CardHeader className="card-header-flex">
            <h3>System Status</h3>
          </CardHeader>
          <CardBody>
            <div className="status-list">
              <div className="status-item">
                <div className="status-info">
                  <span className="status-dot success"></span>
                  <span>Database Connection</span>
                </div>
                <span className="status-badge success">Healthy</span>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span className="status-dot success"></span>
                  <span>Email Service</span>
                </div>
                <span className="status-badge success">Active</span>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span className="status-dot warning"></span>
                  <span>Workload Alerts</span>
                </div>
                <span className="status-badge warning">3 Warnings</span>
              </div>
              <div className="status-item">
                <div className="status-info">
                  <span className="status-dot success"></span>
                  <span>Timetable Sync</span>
                </div>
                <span className="status-badge success">Up to date</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Alerts */}
        <Card className="dashboard-card">
          <CardHeader className="card-header-flex">
            <h3>Alerts</h3>
            <span className="alert-count">2</span>
          </CardHeader>
          <CardBody>
            <div className="alerts-list">
              <div className="alert-item warning">
                <div className="alert-icon">
                  <FiAlertCircle size={20} />
                </div>
                <div className="alert-content">
                  <p className="alert-title">3 Staff members overloaded</p>
                  <p className="alert-desc">Some instructors exceed maximum workload</p>
                </div>
              </div>
              <div className="alert-item info">
                <div className="alert-icon">
                  <FiAlertCircle size={20} />
                </div>
                <div className="alert-content">
                  <p className="alert-title">5 Batches pending timetable</p>
                  <p className="alert-desc">Timetables not yet published</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;