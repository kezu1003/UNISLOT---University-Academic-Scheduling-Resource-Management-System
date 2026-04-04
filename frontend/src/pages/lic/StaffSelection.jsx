// StaffSelection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiCheck, FiX, FiUser,
  FiClock, FiMapPin, FiStar, FiAlertCircle,
  FiAlertTriangle, FiInfo, FiCheckCircle, FiUsers
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { licAPI } from '../../services/api';
import { SPECIALIZATIONS, LOCATIONS, SESSION_TYPES } from '../../utils/constants';
import { getWorkloadStatus, getWorkloadColor } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './StaffSelection.css';

// Validation Rules
const VALIDATION_RULES = {
  course: {
    required: true,
    message: 'Please select a course'
  },
  instructors: {
    required: true,
    minCount: 1,
    maxCount: 3,
    messages: {
      required: 'Please select at least one instructor',
      minCount: 'At least 1 instructor is required',
      maxCount: 'Maximum 3 instructors allowed'
    }
  },
  instructorType: {
    required: true,
    validTypes: ['lecture', 'tutorial', 'lab'],
    message: 'Please select a session type for each instructor'
  },
  priority: {
    required: true,
    validPriorities: [1, 2, 3],
    message: 'Each instructor must have a unique priority (1-3)'
  }
};

// Validation Helper Functions
const validateCourseSelection = (course) => {
  if (!course) {
    return { valid: false, error: VALIDATION_RULES.course.message };
  }
  return { valid: true, error: null };
};

const validateInstructorCount = (instructors) => {
  if (!instructors || instructors.length === 0) {
    return { valid: false, error: VALIDATION_RULES.instructors.messages.required };
  }
  if (instructors.length > VALIDATION_RULES.instructors.maxCount) {
    return { valid: false, error: VALIDATION_RULES.instructors.messages.maxCount };
  }
  return { valid: true, error: null };
};

const validateInstructorTypes = (instructors) => {
  const invalidInstructors = instructors.filter(
    i => !i.type || !VALIDATION_RULES.instructorType.validTypes.includes(i.type)
  );
  if (invalidInstructors.length > 0) {
    return { valid: false, error: VALIDATION_RULES.instructorType.message };
  }
  return { valid: true, error: null };
};

const validatePriorities = (instructors) => {
  const priorities = instructors.map(i => i.priority);
  const uniquePriorities = new Set(priorities);
  
  if (priorities.length !== uniquePriorities.size) {
    return { valid: false, error: 'Each instructor must have a unique priority' };
  }
  
  const invalidPriorities = priorities.filter(
    p => !VALIDATION_RULES.priority.validPriorities.includes(p)
  );
  if (invalidPriorities.length > 0) {
    return { valid: false, error: 'Priority must be 1, 2, or 3' };
  }
  
  return { valid: true, error: null };
};

const validateWorkload = (staffMember) => {
  const status = getWorkloadStatus(staffMember.currentWorkload, staffMember.maxWorkload);
  if (status === 'overloaded') {
    return { valid: false, error: `${staffMember.name} is overloaded and cannot be assigned` };
  }
  return { valid: true, error: null };
};

// Validation Status Component
const ValidationStatus = ({ validations, showAll = false }) => {
  const errors = Object.values(validations).filter(v => !v.valid);
  const allValid = errors.length === 0;

  if (allValid && !showAll) return null;

  return (
    <div className={`validation-status ${allValid ? 'valid' : 'invalid'}`}>
      {allValid ? (
        <div className="validation-success">
          <FiCheckCircle size={16} />
          <span>All validations passed</span>
        </div>
      ) : (
        <div className="validation-errors">
          <div className="validation-header">
            <FiAlertTriangle size={16} />
            <span>{errors.length} validation issue(s)</span>
          </div>
          <ul className="error-list">
            {errors.map((err, idx) => (
              <li key={idx}>
                <FiAlertCircle size={12} />
                <span>{err.error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Selection Progress Component
const SelectionProgress = ({ course, instructors, maxInstructors = 3 }) => {
  const steps = [
    { 
      label: 'Select Course', 
      completed: !!course,
      icon: FiCheckCircle
    },
    { 
      label: 'Add Instructors', 
      completed: instructors.length > 0,
      count: `${instructors.length}/${maxInstructors}`,
      icon: FiUsers
    },
    { 
      label: 'Set Priorities', 
      completed: instructors.length > 0 && instructors.every(i => i.priority),
      icon: FiStar
    },
    { 
      label: 'Assign Types', 
      completed: instructors.length > 0 && instructors.every(i => i.type),
      icon: FiCheck
    }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const percentage = (completedSteps / steps.length) * 100;

  return (
    <div className="selection-progress">
      <div className="progress-header">
        <span className="progress-title">Assignment Progress</span>
        <span className={`progress-percentage ${percentage === 100 ? 'complete' : ''}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${percentage === 100 ? 'complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-steps">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div 
              key={idx} 
              className={`progress-step ${step.completed ? 'completed' : ''}`}
            >
              <div className="step-icon">
                {step.completed ? <FiCheck size={12} /> : <Icon size={12} />}
              </div>
              <span className="step-label">{step.label}</span>
              {step.count && (
                <span className="step-count">{step.count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Instructor Card Component with Validation
const InstructorCard = ({ 
  instructor, 
  staffMember, 
  onUpdateType, 
  onUpdatePriority, 
  onRemove,
  allPriorities,
  errors = {}
}) => {
  const hasTypeError = errors.type;
  const hasPriorityError = errors.priority;

  return (
    <div className={`selected-card priority-${instructor.priority} ${hasTypeError || hasPriorityError ? 'has-error' : ''}`}>
      <div className="selected-header">
        <div className={`priority-number ${hasPriorityError ? 'error' : ''}`}>
          {instructor.priority || '?'}
        </div>
        <div className="selected-info">
          <p className="selected-name">{staffMember?.name}</p>
          <p className="selected-email">{staffMember?.email}</p>
        </div>
        <button 
          className="remove-btn"
          onClick={() => onRemove(staffMember?._id)}
          title="Remove instructor"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Type Selection with Validation */}
      <div className={`form-group ${hasTypeError ? 'has-error' : ''}`}>
        <label className="form-label">Session Type <span className="required">*</span></label>
        <div className="type-buttons">
          {SESSION_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              className={`type-btn ${instructor.type === type.value ? 'active' : ''}`}
              onClick={() => onUpdateType(staffMember?._id, type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
        {hasTypeError && (
          <span className="form-error">
            <FiAlertCircle size={12} /> Please select a type
          </span>
        )}
      </div>

      {/* Priority Selection with Validation */}
      <div className={`form-group ${hasPriorityError ? 'has-error' : ''}`}>
        <label className="form-label">Priority <span className="required">*</span></label>
        <div className="priority-controls">
          {[1, 2, 3].map(p => {
            const isUsed = allPriorities.includes(p) && instructor.priority !== p;
            return (
              <button
                key={p}
                className={`priority-btn ${instructor.priority === p ? 'active' : ''} ${isUsed ? 'used' : ''}`}
                onClick={() => onUpdatePriority(staffMember?._id, p)}
                disabled={isUsed}
                title={isUsed ? 'Priority already assigned' : `Set as priority ${p}`}
              >
                {p}
                {isUsed && <span className="used-indicator">●</span>}
              </button>
            );
          })}
        </div>
        {hasPriorityError && (
          <span className="form-error">
            <FiAlertCircle size={12} /> Please select a priority
          </span>
        )}
      </div>

      {/* Workload Info */}
      <div className="instructor-workload">
        <FiClock size={12} />
        <span>
          Current: {staffMember?.currentWorkload || 0}/{staffMember?.maxWorkload || 20} hrs
        </span>
      </div>
    </div>
  );
};

// Staff Card Component with Validation Feedback
const StaffCard = ({
  member,
  isSelected,
  isDisabled,
  canAdd,
  onAddInstructor,
  validationMessage
}) => {
  const workloadStatus = getWorkloadStatus(member.currentWorkload, member.maxWorkload);
  const workloadColor = getWorkloadColor(member.currentWorkload, member.maxWorkload);
  const isOverloaded = workloadStatus === 'overloaded';

  return (
    <div 
      className={`staff-card ${isSelected ? 'selected' : ''} ${isDisabled || isOverloaded ? 'disabled' : ''}`}
    >
      <div className="staff-header">
        <div className="staff-avatar">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div className="staff-info">
          <p className="staff-name">{member.name}</p>
          <p className="staff-email">{member.email}</p>
        </div>
        <div className="priority-badge" title="Staff Priority">
          <FiStar size={12} />
          <span>{member.priority}</span>
        </div>
      </div>

      <div className="staff-meta">
        <span className="meta-item">
          <FiMapPin size={12} />
          {member.location}
        </span>
        <span className="meta-item">
          <FiClock size={12} />
          {member.currentWorkload}/{member.maxWorkload} hrs
        </span>
      </div>

      <div className="workload-bar">
        <div 
          className="workload-fill"
          style={{ 
            width: `${Math.min((member.currentWorkload / member.maxWorkload) * 100, 100)}%`,
            backgroundColor: workloadColor
          }}
        />
      </div>
      <div className="workload-status">
        <span className={`status-text ${workloadStatus}`}>
          {workloadStatus === 'available' && 'Available'}
          {workloadStatus === 'moderate' && 'Moderate Load'}
          {workloadStatus === 'high' && 'High Load'}
          {workloadStatus === 'overloaded' && 'Overloaded'}
        </span>
      </div>

      <div className="staff-specs">
        {member.specialization.map((spec, i) => (
          <Badge key={i} variant="neutral" size="sm">{spec}</Badge>
        ))}
      </div>

      {/* Action Buttons */}
      {canAdd && !isSelected && !isOverloaded && (
        <div className="staff-actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddInstructor(member, 'lecture')}
            className="action-btn-lecture"
          >
            <span>+ Lecture</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddInstructor(member, 'tutorial')}
            className="action-btn-tutorial"
          >
            <span>+ Tutorial</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddInstructor(member, 'lab')}
            className="action-btn-lab"
          >
            <span>+ Lab</span>
          </Button>
        </div>
      )}

      {/* Overlays */}
      {isSelected && (
        <div className="selected-overlay">
          <FiCheck size={24} />
          <span>Selected</span>
        </div>
      )}

      {isOverloaded && (
        <div className="overloaded-overlay">
          <FiAlertCircle size={20} />
          <span>Overloaded</span>
          <p>Cannot assign more work</p>
        </div>
      )}

      {validationMessage && (
        <div className="validation-message">
          <FiInfo size={14} />
          <span>{validationMessage}</span>
        </div>
      )}
    </div>
  );
};

// Main Component
const StaffSelection = () => {
  const [searchParams] = useSearchParams();
  const selectedCourseId = searchParams.get('course');

  // Data State
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Validation State
  const [validations, setValidations] = useState({
    course: { valid: false, error: null },
    instructorCount: { valid: false, error: null },
    instructorTypes: { valid: true, error: null },
    priorities: { valid: true, error: null }
  });
  const [instructorErrors, setInstructorErrors] = useState({});
  const [touched, setTouched] = useState({
    course: false,
    instructors: false
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    location: ''
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, staffRes] = await Promise.all([
        licAPI.getCourses(),
        licAPI.getStaff()
      ]);

      const coursesData = coursesRes.data.data || [];
      setCourses(coursesData);
      setStaff(staffRes.data.data || []);

      // Auto-select course if ID provided
      if (selectedCourseId) {
        const course = coursesData.find(c => c._id === selectedCourseId);
        if (course) {
          setSelectedCourse(course);
          setSelectedInstructors(course.instructors || []);
          setTouched(prev => ({ ...prev, course: true }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Validate on data change
  useEffect(() => {
    const newValidations = {
      course: validateCourseSelection(selectedCourse),
      instructorCount: validateInstructorCount(selectedInstructors),
      instructorTypes: validateInstructorTypes(selectedInstructors),
      priorities: validatePriorities(selectedInstructors)
    };
    setValidations(newValidations);

    // Validate individual instructors
    const errors = {};
    selectedInstructors.forEach(instructor => {
      const staffId = instructor.staff?._id || instructor.staff;
      errors[staffId] = {
        type: !instructor.type,
        priority: !instructor.priority
      };
    });
    setInstructorErrors(errors);
  }, [selectedCourse, selectedInstructors]);

  // Check if form is valid
  const isFormValid = Object.values(validations).every(v => v.valid);

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!s.name.toLowerCase().includes(searchLower) && 
          !s.email.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (filters.specialization && !s.specialization.includes(filters.specialization)) {
      return false;
    }
    if (filters.location && s.location !== filters.location) {
      return false;
    }
    return true;
  }).sort((a, b) => a.priority - b.priority);

  // Handle course selection
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedInstructors(course.instructors || []);
    setTouched(prev => ({ ...prev, course: true }));
  };

  // Add instructor with validation
  const addInstructor = (staffMember, type) => {
    // Validate max count
    if (selectedInstructors.length >= VALIDATION_RULES.instructors.maxCount) {
      toast.warning('Maximum 3 instructors allowed per course');
      return;
    }

    // Check if already added
    if (selectedInstructors.some(i => (i.staff?._id || i.staff) === staffMember._id)) {
      toast.warning('This instructor is already assigned');
      return;
    }

    // Validate workload
    const workloadValidation = validateWorkload(staffMember);
    if (!workloadValidation.valid) {
      toast.error(workloadValidation.error);
      return;
    }

    // Determine priority
    const usedPriorities = selectedInstructors.map(i => i.priority);
    let newPriority = 1;
    while (usedPriorities.includes(newPriority) && newPriority <= 3) {
      newPriority++;
    }

    if (newPriority > 3) {
      newPriority = null; // Will require manual selection
    }

    const newInstructor = {
      staff: staffMember,
      priority: newPriority,
      type: type
    };

    setSelectedInstructors([...selectedInstructors, newInstructor]);
    setTouched(prev => ({ ...prev, instructors: true }));
    
    if (newPriority) {
      toast.success(`${staffMember.name} added as priority ${newPriority} instructor`);
    } else {
      toast.info(`${staffMember.name} added. Please set priority manually.`);
    }
  };

  // Remove instructor
  const removeInstructor = (staffId) => {
    setSelectedInstructors(selectedInstructors.filter(
      i => (i.staff?._id || i.staff) !== staffId
    ));
    toast.info('Instructor removed');
  };

  // Update instructor priority with validation
  const updateInstructorPriority = (staffId, newPriority) => {
    // Check if priority is already used
    const existingWithPriority = selectedInstructors.find(
      i => i.priority === newPriority && (i.staff?._id || i.staff) !== staffId
    );

    if (existingWithPriority) {
      // Swap priorities
      setSelectedInstructors(selectedInstructors.map(i => {
        const id = i.staff?._id || i.staff;
        if (id === staffId) {
          return { ...i, priority: newPriority };
        }
        if (i.priority === newPriority) {
          const oldInstructor = selectedInstructors.find(ins => (ins.staff?._id || ins.staff) === staffId);
          return { ...i, priority: oldInstructor?.priority || null };
        }
        return i;
      }));
    } else {
      setSelectedInstructors(selectedInstructors.map(i => {
        const id = i.staff?._id || i.staff;
        if (id === staffId) {
          return { ...i, priority: newPriority };
        }
        return i;
      }));
    }
  };

  // Update instructor type
  const updateInstructorType = (staffId, newType) => {
    setSelectedInstructors(selectedInstructors.map(i => {
      const id = i.staff?._id || i.staff;
      if (id === staffId) {
        return { ...i, type: newType };
      }
      return i;
    }));
  };

  // Validate before submit
  const validateBeforeSubmit = () => {
    const errors = [];

    // Course validation
    if (!selectedCourse) {
      errors.push('Please select a course');
    }

    // Instructor count validation
    if (selectedInstructors.length === 0) {
      errors.push('Please select at least one instructor');
    }

    // Type validation
    const missingTypes = selectedInstructors.filter(i => !i.type);
    if (missingTypes.length > 0) {
      errors.push('All instructors must have a session type assigned');
    }

    // Priority validation
    const missingPriorities = selectedInstructors.filter(i => !i.priority);
    if (missingPriorities.length > 0) {
      errors.push('All instructors must have a priority assigned');
    }

    // Unique priority validation
    const priorities = selectedInstructors.map(i => i.priority).filter(Boolean);
    const uniquePriorities = new Set(priorities);
    if (priorities.length !== uniquePriorities.size) {
      errors.push('Each instructor must have a unique priority');
    }

    return errors;
  };

  // Handle submit button click
  const handleSubmitClick = () => {
    const errors = validateBeforeSubmit();
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setShowConfirmModal(true);
  };

  // Submit assignment
  const handleSubmit = async () => {
    const errors = validateBeforeSubmit();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        instructors: selectedInstructors.map(i => ({
          staff: i.staff?._id || i.staff,
          priority: i.priority,
          type: i.type
        }))
      };

      await licAPI.assignInstructors(selectedCourse._id, payload);
      toast.success('Instructors assigned successfully');
      setShowConfirmModal(false);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to assign instructors';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Get all used priorities
  const usedPriorities = selectedInstructors.map(i => i.priority).filter(Boolean);

  if (loading) {
    return <Loading text="Loading..." />;
  }

  return (
    <div className="staff-selection">
      <div className="page-header">
        <div>
          <h2>Assign Instructors</h2>
          <p>Select up to 3 instructors for each course based on priority</p>
        </div>
      </div>

      {/* Selection Progress */}
      <SelectionProgress 
        course={selectedCourse}
        instructors={selectedInstructors}
        maxInstructors={3}
      />

      <div className="selection-layout">
        {/* Left: Course Selection */}
        <div className="course-panel">
          <Card>
            <CardHeader>
              <h3>Select Course</h3>
              {touched.course && !selectedCourse && (
                <Badge variant="error">Required</Badge>
              )}
            </CardHeader>
            <CardBody className="no-padding">
              <div className="course-list">
                {courses.length === 0 ? (
                  <div className="empty-courses">
                    <FiInfo size={24} />
                    <p>No courses available</p>
                  </div>
                ) : (
                  courses.map(course => (
                    <div
                      key={course._id}
                      className={`course-item ${selectedCourse?._id === course._id ? 'selected' : ''}`}
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="course-main">
                        <span className="course-code">{course.courseCode}</span>
                        <span className="course-name">{course.courseName}</span>
                        <span className="course-meta">
                          Year {course.year} • Sem {course.semester}
                        </span>
                      </div>
                      <div className="course-status">
                        {course.instructors?.length > 0 ? (
                          <Badge variant="success">
                            <FiCheck size={10} /> {course.instructors.length} assigned
                          </Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Center: Staff Selection */}
        <div className="staff-panel">
          <Card>
            <CardHeader>
              <h3>Available Staff</h3>
              <div className="header-info">
                <span className="staff-count">{filteredStaff.length} available</span>
                {selectedCourse && (
                  <Badge variant="primary">
                    {selectedInstructors.length}/3 selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {/* Course Selection Required Message */}
              {!selectedCourse && (
                <div className="select-course-message">
                  <FiAlertCircle size={24} />
                  <p>Please select a course first</p>
                  <span>Choose a course from the left panel to start assigning instructors</span>
                </div>
              )}

              {selectedCourse && (
                <>
                  {/* Filters */}
                  <div className="staff-filters">
                    <Input
                      placeholder="Search staff..."
                      icon={<FiSearch />}
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <Select
                      placeholder="Specialization"
                      options={SPECIALIZATIONS}
                      value={filters.specialization}
                      onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    />
                    <Select
                      placeholder="Location"
                      options={LOCATIONS}
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ search: '', specialization: '', location: '' })}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Selection Limit Warning */}
                  {selectedInstructors.length >= 3 && (
                    <div className="limit-warning">
                      <FiAlertTriangle size={16} />
                      <span>Maximum instructor limit reached (3/3)</span>
                    </div>
                  )}

                  {/* Staff List */}
                  <div className="staff-list">
                    {filteredStaff.length === 0 ? (
                      <div className="empty-staff">
                        <FiUsers size={32} />
                        <p>No staff found</p>
                        <span>Try adjusting your filters</span>
                      </div>
                    ) : (
                      filteredStaff.map(member => {
                        const isSelected = selectedInstructors.some(
                          i => (i.staff?._id || i.staff) === member._id
                        );
                        const canAdd = selectedInstructors.length < 3;

                        return (
                          <StaffCard
                            key={member._id}
                            member={member}
                            isSelected={isSelected}
                            isDisabled={!canAdd && !isSelected}
                            canAdd={canAdd}
                            onAddInstructor={addInstructor}
                          />
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Selected Instructors */}
        <div className="selected-panel">
          <Card>
            <CardHeader>
              <h3>Selected Instructors</h3>
              <Badge variant={selectedInstructors.length === 3 ? 'warning' : 'primary'}>
                {selectedInstructors.length}/3
              </Badge>
            </CardHeader>
            <CardBody>
              {!selectedCourse ? (
                <div className="empty-selection">
                  <FiUser size={48} />
                  <p>Select a course to begin</p>
                  <span>Choose a course from the left panel</span>
                </div>
              ) : selectedInstructors.length === 0 ? (
                <div className="empty-selection">
                  <FiUser size={48} />
                  <p>No instructors selected</p>
                  <span>Click on staff cards to add instructors</span>
                </div>
              ) : (
                <>
                  {/* Validation Status */}
                  {touched.instructors && (
                    <ValidationStatus validations={validations} />
                  )}

                  {/* Selected Instructors List */}
                  <div className="selected-list">
                    {selectedInstructors
                      .sort((a, b) => (a.priority || 99) - (b.priority || 99))
                      .map((instructor, index) => {
                        const staffMember = typeof instructor.staff === 'object' 
                          ? instructor.staff 
                          : staff.find(s => s._id === instructor.staff);
                        const staffId = staffMember?._id;

                        return (
                          <InstructorCard
                            key={staffId || index}
                            instructor={instructor}
                            staffMember={staffMember}
                            onUpdateType={updateInstructorType}
                            onUpdatePriority={updateInstructorPriority}
                            onRemove={removeInstructor}
                            allPriorities={usedPriorities}
                            errors={instructorErrors[staffId] || {}}
                          />
                        );
                      })}
                  </div>
                </>
              )}

              {/* Submit Button */}
              {selectedCourse && selectedInstructors.length > 0 && (
                <div className="submit-section">
                  {!isFormValid && (
                    <div className="submit-warning">
                      <FiAlertCircle size={14} />
                      <span>Please fix validation errors before submitting</span>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleSubmitClick}
                    disabled={!isFormValid}
                    className="submit-btn"
                  >
                    <FiCheck size={16} />
                    Submit Assignment
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Assignment"
        size="md"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit} 
              loading={submitting}
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </>
        }
      >
        <div className="confirm-content">
          <div className="confirm-header">
            <FiCheckCircle size={48} className="confirm-icon" />
            <p>You are about to assign the following instructors:</p>
          </div>

          <div className="confirm-course">
            <span className="code">{selectedCourse?.courseCode}</span>
            <span className="name">{selectedCourse?.courseName}</span>
          </div>

          <div className="confirm-list">
            {selectedInstructors
              .sort((a, b) => a.priority - b.priority)
              .map((instructor, index) => {
                const staffMember = typeof instructor.staff === 'object' 
                  ? instructor.staff 
                  : staff.find(s => s._id === instructor.staff);

                return (
                  <div key={index} className="confirm-item">
                    <div className="confirm-priority">
                      <span className="priority-badge-confirm">{instructor.priority}</span>
                    </div>
                    <div className="confirm-info">
                      <span className="name">{staffMember?.name}</span>
                      <span className="email">{staffMember?.email}</span>
                    </div>
                    <Badge 
                      variant={
                        instructor.type === 'lecture' ? 'primary' :
                        instructor.type === 'tutorial' ? 'success' : 'warning'
                      }
                    >
                      {instructor.type}
                    </Badge>
                  </div>
                );
              })}
          </div>

          <div className="confirm-note">
            <FiInfo size={14} />
            <span>This will update the instructor assignments for this course.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffSelection;