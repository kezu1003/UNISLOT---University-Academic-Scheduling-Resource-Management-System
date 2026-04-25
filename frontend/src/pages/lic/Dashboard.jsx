import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBook, FiUsers, FiCheckCircle, FiClock,
  FiAlertCircle, FiArrowRight
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import HallAvailabilityPanel from '../../components/common/HallAvailabilityPanel';
import { licAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const LICDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await licAPI.getCourses();
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalCourses: courses?.length || 0,
    assignedCourses: courses?.filter(c => c?.instructors?.length > 0).length || 0,
    pendingCourses: courses?.filter(c => !c?.instructors || c?.instructors?.length === 0).length || 0,
    totalBatches: courses?.reduce((sum, c) => sum + (c?.batches?.length || 0), 0) || 0
  };

  console.log('📊 Dashboard Stats:', stats);
  console.log('📚 Courses Data:', courses);

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div className="lic-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome, {user?.name}! 👋</h2>
          <p>Manage your course assignments and instructor allocations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="icon primary">
            <FiBook size={24} />
          </div>
          <div className="stats-content">
            <p className="stats-value">{stats.totalCourses}</p>
            <p className="stats-label">Total Courses</p>
          </div>
        </div>
        <div className="stats-card">
          <div className="icon success">
            <FiCheckCircle size={24} />
          </div>
          <div className="stats-content">
            <p className="stats-value">{stats.assignedCourses}</p>
            <p className="stats-label">Assigned</p>
          </div>
        </div>
        <div className="stats-card">
          <div className="icon warning">
            <FiClock size={24} />
          </div>
          <div className="stats-content">
            <p className="stats-value">{stats.pendingCourses}</p>
            <p className="stats-label">Pending</p>
          </div>
        </div>
        <div className="stats-card">
          <div className="icon error">
            <FiUsers size={24} />
          </div>
          <div className="stats-content">
            <p className="stats-value">{stats.totalBatches}</p>
            <p className="stats-label">Batches</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Courses Requiring Action */}
        <Card>
          <CardHeader>
            <h3>Courses Requiring Action</h3>
            <Link to="/lic/assign" className="view-all">
              View All <FiArrowRight />
            </Link>
          </CardHeader>
          <CardBody className="no-padding">
            {courses.filter(c => !c.instructors || c.instructors.length === 0).length === 0 ? (
              <div className="empty-state">
                <FiCheckCircle size={48} />
                <p>All courses have been assigned!</p>
              </div>
            ) : (
              <div className="course-list">
                {courses
                  .filter(c => !c?.instructors || c?.instructors?.length === 0)
                  .slice(0, 5)
                  .map(course => (
                    <Link 
                      to={`/lic/assign?course=${course?._id}`} 
                      key={course?._id}
                      className="course-item pending"
                    >
                      <div className="course-info">
                        <span className="course-code">{course?.courseCode || 'N/A'}</span>
                        <span className="course-name">{course?.courseName || 'N/A'}</span>
                      </div>
                      <div className="course-meta">
                        <Badge variant="warning">Pending</Badge>
                        <span className="batch-count">
                          <FiUsers size={14} />
                          {course?.batches?.length || 0} batches
                        </span>
                      </div>
                      <FiArrowRight className="arrow" />
                    </Link>
                  ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* My Courses */}
        <Card>
          <CardHeader>
            <h3>My Courses</h3>
          </CardHeader>
          <CardBody className="no-padding">
            {courses && courses.length > 0 ? (
              <div className="course-list">
                {courses.slice(0, 6).map(course => (
                  <div key={course?._id} className="course-item">
                    <div className="course-info">
                      <span className="course-code">{course?.courseCode || 'N/A'}</span>
                      <span className="course-name">{course?.courseName || 'N/A'}</span>
                    </div>
                    <div className="course-meta">
                      <Badge variant={course?.instructors?.length > 0 ? 'success' : 'warning'}>
                        {course?.instructors?.length || 0} Instructors
                      </Badge>
                      <span className="hours">
                        <FiClock size={14} />
                        {((course?.lectureHours || 0) + (course?.tutorialHours || 0) + (course?.labHours || 0))} hrs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiBook size={48} />
                <p>No courses assigned</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3>Hall / Lab Availability</h3>
        </CardHeader>
        <CardBody>
          <HallAvailabilityPanel
            title="Check Availability Before Planning"
            description="LIC can review free halls and labs for a proposed time slot before coordinating the timetable."
            fetchAvailability={licAPI.getHallAvailability}
          />
        </CardBody>
      </Card>

      {/* Alerts */}
      {stats.pendingCourses > 0 && (
        <Card className="alert-card">
          <CardBody>
            <div className="alert-content">
              <FiAlertCircle size={24} />
              <div>
                <h4>Action Required</h4>
                <p>You have {stats.pendingCourses} course(s) without assigned instructors. Please assign instructors to ensure timely timetable creation.</p>
              </div>
              <Link to="/lic/assign" className="btn btn-primary">
                Assign Now
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default LICDashboard;
