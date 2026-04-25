import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiFilter, FiDownload, FiUser, FiClock,
  FiAlertTriangle, FiCheckCircle, FiMapPin
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { coordinatorAPI } from '../../services/api';
import { LOCATIONS } from '../../utils/constants';
import { getWorkloadStatus, getWorkloadColor } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './WorkloadOverview.css';

const WorkloadOverview = () => {
  const [loading, setLoading] = useState(true);
  const [workloadData, setWorkloadData] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    status: ''
  });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [staffDetail, setStaffDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      const response = await coordinatorAPI.getAllWorkload();
      const data = response.data.data || [];
      
      setWorkloadData(data);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching workload:', error);
      toast.error('Failed to fetch workload data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff detail
  const fetchStaffDetail = async (staffId) => {
    setDetailLoading(true);
    try {
      const response = await coordinatorAPI.getStaffWorkload(staffId);
      setStaffDetail(response.data.data);
    } catch (error) {
      console.error('Error fetching staff detail:', error);
      toast.error('Failed to fetch staff details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Open detail modal
  const openDetailModal = (staff) => {
    setSelectedStaff(staff);
    setShowDetailModal(true);
    fetchStaffDetail(staff._id);
  };

  // Filter workload data
  const filteredData = workloadData.filter(w => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!w.name.toLowerCase().includes(searchLower) &&
          !w.email.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (filters.location && w.location !== filters.location) return false;
    if (filters.status && w.status !== filters.status) return false;
    return true;
  });

  // Prepare chart data
  const chartData = filteredData.slice(0, 15).map(w => ({
    name: w.name.split(' ')[0],
    current: w.currentWorkload,
    max: w.maxWorkload,
    status: w.status
  }));

  // Get bar color based on status
  const getBarColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'near-capacity': return '#F44336';
      case 'overloaded': return '#B71C1C';
      default: return '#9E9E9E';
    }
  };

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'near-capacity', label: 'Near Capacity' },
    { value: 'overloaded', label: 'Overloaded' }
  ];

  if (loading) {
    return <Loading text="Loading workload data..." />;
  }

  return (
    <div className="workload-overview">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Workload Overview</h2>
          <p>Monitor and manage staff workload distribution</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" icon={<FiDownload />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card available">
          <FiCheckCircle size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.available || 0}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
        <div className="stat-card moderate">
          <FiClock size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.moderate || 0}</span>
            <span className="stat-label">Moderate</span>
          </div>
        </div>
        <div className="stat-card near-capacity">
          <FiAlertTriangle size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.nearCapacity || 0}</span>
            <span className="stat-label">Near Capacity</span>
          </div>
        </div>
        <div className="stat-card overloaded">
          <FiAlertTriangle size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.overloaded || 0}</span>
            <span className="stat-label">Overloaded</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="chart-card">
        <CardHeader>
          <h3>Workload Distribution</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [value + ' hrs', name === 'current' ? 'Current' : 'Maximum']}
              />
              <Bar dataKey="max" fill="#E0E0E0" name="max" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" name="current" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card className="filters-card">
        <CardBody>
          <div className="filters-row">
            <div className="search-box">
              <Input
                placeholder="Search staff..."
                icon={<FiSearch />}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              placeholder="All Locations"
              options={LOCATIONS}
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
            <Select
              placeholder="All Status"
              options={statusOptions}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            />
          </div>
        </CardBody>
      </Card>

      {/* Staff List */}
      <div className="staff-grid">
        {filteredData.map(staff => (
          <Card 
            key={staff._id} 
            className={`staff-card ${staff.status}`}
            onClick={() => openDetailModal(staff)}
          >
            <CardBody>
              <div className="staff-header">
                <div className="staff-avatar">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div className="staff-info">
                  <h4>{staff.name}</h4>
                  <p>{staff.email}</p>
                </div>
                <Badge variant={
                  staff.status === 'available' ? 'success' :
                  staff.status === 'moderate' ? 'warning' :
                  staff.status === 'near-capacity' ? 'error' : 'error'
                }>
                  {staff.status.replace('-', ' ')}
                </Badge>
              </div>

              <div className="workload-meter">
                <div className="meter-header">
                  <span>Workload</span>
                  <span>{staff.currentWorkload}/{staff.maxWorkload} hrs</span>
                </div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill"
                    style={{ 
                      width: `${Math.min(staff.workloadPercentage, 100)}%`,
                      backgroundColor: getWorkloadColor(staff.currentWorkload, staff.maxWorkload)
                    }}
                  />
                </div>
                <div className="meter-percentage">
                  {Math.round(staff.workloadPercentage)}%
                </div>
              </div>

              <div className="staff-meta">
                <span><FiMapPin size={14} /> {staff.location}</span>
                <span><FiClock size={14} /> {staff.availableHours} hrs available</span>
              </div>

              <div className="staff-specs">
                {staff.specialization?.slice(0, 3).map((spec, i) => (
                  <Badge key={i} variant="neutral" size="sm">{spec}</Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setStaffDetail(null); }}
        title="Staff Workload Details"
        size="lg"
      >
        {detailLoading ? (
          <Loading text="Loading details..." />
        ) : staffDetail && (
          <div className="staff-detail">
            <div className="detail-header">
              <div className="detail-avatar">
                {staffDetail.staff?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="detail-info">
                <h3>{staffDetail.staff?.name}</h3>
                <p>{staffDetail.staff?.email}</p>
                <div className="detail-badges">
                  <Badge variant="primary">{staffDetail.staff?.location}</Badge>
                  <Badge variant={
                    staffDetail.staff?.workloadPercentage < 70 ? 'success' :
                    staffDetail.staff?.workloadPercentage < 90 ? 'warning' : 'error'
                  }>
                    {Math.round(staffDetail.staff?.workloadPercentage || 0)}% Loaded
                  </Badge>
                </div>
              </div>
            </div>

            <div className="detail-stats">
              <div className="stat">
                <span className="stat-value">{staffDetail.staff?.currentWorkload || 0}</span>
                <span className="stat-label">Current Hours</span>
              </div>
              <div className="stat">
                <span className="stat-value">{staffDetail.staff?.maxWorkload || 0}</span>
                <span className="stat-label">Max Hours</span>
              </div>
              <div className="stat">
                <span className="stat-value">{staffDetail.staff?.availableHours || 0}</span>
                <span className="stat-label">Available Hours</span>
              </div>
              <div className="stat">
                <span className="stat-value">{staffDetail.totalSchedules || 0}</span>
                <span className="stat-label">Total Classes</span>
              </div>
            </div>

            <div className="week-schedule">
              <h4>Weekly Schedule</h4>
              <div className="schedule-grid">
                {Object.entries(staffDetail.weekSchedule || {}).map(([day, schedules]) => (
                  <div key={day} className="day-column">
                    <div className="day-header">{day.substring(0, 3)}</div>
                    <div className="day-content">
                      {schedules.length === 0 ? (
                        <span className="no-class">Free</span>
                      ) : (
                        schedules.map((schedule, idx) => (
                          <div key={idx} className="mini-schedule">
                            <span className="time">{schedule.startTime}</span>
                            <span className="course">{schedule.course?.courseCode}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="assignments-list">
              <h4>Course Assignments</h4>
              {staffDetail.assignments?.map((assignment, idx) => (
                <div key={idx} className="assignment-item">
                  <div className="assignment-info">
                    <span className="assignment-code">{assignment.courseCode}</span>
                    <span className="assignment-name">{assignment.courseName}</span>
                  </div>
                  <div className="assignment-meta">
                    <Badge variant="primary">{assignment.type}</Badge>
                    <span>{assignment.hours} hrs/week</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkloadOverview;