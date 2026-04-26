import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, FiUsers, FiAlertTriangle, FiCheckCircle,
  FiClock, FiArrowRight, FiSend, FiRefreshCw
} from 'react-icons/fi';
import { coordinatorAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Dashboard.css';

const CoordinatorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalScheduled: 0,
    publishedSchedules: 0,
    pendingSchedules: 0,
    totalConflicts: 0,
    totalBatches: 0,
    batchesWithTimetable: 0
  });
  const [workloadData, setWorkloadData] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching dashboard data...');
      
      // Fetch all data in parallel
      const [timetableRes, workloadRes, conflictsRes, batchesRes] = await Promise.all([
        coordinatorAPI.getTimetable().catch(err => {
          console.error('Timetable fetch error:', err);
          return { data: { data: [] } };
        }),
        coordinatorAPI.getAllWorkload().catch(err => {
          console.error('Workload fetch error:', err);
          return { data: { data: [], stats: {} } };
        }),
        coordinatorAPI.getConflicts().catch(err => {
          console.error('Conflicts fetch error:', err);
          return { data: { data: [] } };
        }),
        adminAPI.getBatches().catch(err => {
          console.error('Batches fetch error:', err);
          return { data: { data: [] } };
        })
      ]);

      console.log('Timetable response:', timetableRes.data);
      console.log('Workload response:', workloadRes.data);
      console.log('Conflicts response:', conflictsRes.data);
      console.log('Batches response:', batchesRes.data);

      const timetableData = timetableRes.data?.data || [];
      const workload = workloadRes.data?.data || [];
      const conflictData = conflictsRes.data?.data || [];
      const batches = batchesRes.data?.data || [];

      // Calculate stats
      const newStats = {
        totalScheduled: timetableData.length,
        publishedSchedules: timetableData.filter(t => t.isPublished).length,
        pendingSchedules: timetableData.filter(t => !t.isPublished).length,
        totalConflicts: conflictData.length,
        totalBatches: batches.length,
        batchesWithTimetable: [...new Set(timetableData.map(t => t.batch?._id).filter(Boolean))].length
      };
      
      console.log('Calculated stats:', newStats);
      
      setStats(newStats);
      setWorkloadData(workload.slice(0, 10));
      setConflicts(conflictData.slice(0, 5));
      setRecentSchedules(timetableData.slice(0, 5));
      
      toast.success('Dashboard data loaded');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <FiAlertTriangle size={48} color="#F44336" />
        <p>Error: {error}</p>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '12px 24px',
            background: '#1976D2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="coordinator-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome, {user?.name || 'Coordinator'}! 👋</h2>
          <p>Manage timetables, monitor workloads, and resolve conflicts</p>
        </div>
        <div className="welcome-actions">
          <Link to="/coordinator/schedule">
            <button className="btn-primary">
              <FiCalendar /> Schedule Class
            </button>
          </Link>
          <Link to="/coordinator/publish">
            <button className="btn-secondary">
              <FiSend /> Publish Timetable
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="icon primary"><FiCalendar size={24} /></div>
          <div className="stats-content">
            <p className="stats-value">{stats.totalScheduled}</p>
            <p className="stats-label">Total Scheduled</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="icon success"><FiCheckCircle size={24} /></div>
          <div className="stats-content">
            <p className="stats-value">{stats.publishedSchedules}</p>
            <p className="stats-label">Published</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="icon warning"><FiClock size={24} /></div>
          <div className="stats-content">
            <p className="stats-value">{stats.pendingSchedules}</p>
            <p className="stats-label">Pending</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="icon error"><FiAlertTriangle size={24} /></div>
          <div className="stats-content">
            <p className="stats-value">{stats.totalConflicts}</p>
            <p className="stats-label">Conflicts</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Workload Overview */}
        <div className="card">
          <div className="card-header">
            <h3>Staff Workload</h3>
            <Link to="/coordinator/workload" className="view-all">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="card-body">
            {workloadData.length === 0 ? (
              <div className="empty-state">
                <FiUsers size={40} />
                <p>No workload data</p>
              </div>
            ) : (
              <div className="workload-list">
                {workloadData.map((staff, index) => (
                  <div key={staff._id || index} className="workload-item">
                    <div className="staff-info">
                      <span className="staff-name">{staff.name}</span>
                      <span className="staff-location">{staff.location}</span>
                    </div>
                    <div className="workload-bar-container">
                      <div className="workload-bar">
                        <div 
                          className={`workload-fill ${staff.status}`}
                          style={{ width: `${Math.min(staff.workloadPercentage || 0, 100)}%` }}
                        />
                      </div>
                      <span className="workload-text">
                        {staff.currentWorkload || 0}/{staff.maxWorkload || 20} hrs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conflicts */}
        <div className="card">
          <div className="card-header">
            <h3>Active Conflicts</h3>
          </div>
          <div className="card-body">
            {conflicts.length === 0 ? (
              <div className="empty-state success">
                <FiCheckCircle size={40} />
                <p>No conflicts detected!</p>
              </div>
            ) : (
              <div className="conflict-list">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <div className="conflict-icon">
                      <FiAlertTriangle size={16} />
                    </div>
                    <div className="conflict-content">
                      <p className="conflict-type">{conflict.type?.replace('_', ' ')}</p>
                      <p className="conflict-detail">
                        {conflict.entry1?.course} vs {conflict.entry2?.course}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Schedules */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Schedules</h3>
            <Link to="/coordinator/timetable" className="view-all">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="card-body">
            {recentSchedules.length === 0 ? (
              <div className="empty-state">
                <FiCalendar size={40} />
                <p>No schedules yet</p>
                <Link to="/coordinator/schedule">
                  <button className="btn-small">Create Schedule</button>
                </Link>
              </div>
            ) : (
              <div className="schedule-list">
                {recentSchedules.map((schedule, index) => (
                  <div key={schedule._id || index} className="schedule-item">
                    <div className="schedule-time">
                      <span className="day">{schedule.day?.substring(0, 3)}</span>
                      <span className="time">{schedule.startTime}</span>
                    </div>
                    <div className="schedule-content">
                      <p className="schedule-course">{schedule.course?.courseCode || 'N/A'}</p>
                      <p className="schedule-detail">
                        {schedule.batch?.batchCode || 'N/A'} • {schedule.hall?.hallCode || 'N/A'}
                      </p>
                    </div>
                    <span className={`status-badge ${schedule.isPublished ? 'published' : 'draft'}`}>
                      {schedule.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Batch Coverage */}
        <div className="card">
          <div className="card-header">
            <h3>Batch Coverage</h3>
          </div>
          <div className="card-body">
            <div className="coverage-stats">
              <div className="coverage-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E0E0E0"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="3"
                    strokeDasharray={`${stats.totalBatches > 0 ? (stats.batchesWithTimetable / stats.totalBatches) * 100 : 0}, 100`}
                  />
                </svg>
                <div className="coverage-text">
                  <span className="percentage">
                    {stats.totalBatches > 0 
                      ? Math.round((stats.batchesWithTimetable / stats.totalBatches) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
              <div className="coverage-details">
                <p><strong>{stats.batchesWithTimetable}</strong> of <strong>{stats.totalBatches}</strong> batches have timetables</p>
                <Link to="/coordinator/schedule">
                  <button className="btn-small">Schedule Remaining</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;