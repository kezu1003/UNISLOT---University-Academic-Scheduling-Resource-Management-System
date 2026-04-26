import React, { useState, useEffect } from 'react';
import { 
  FiSend, FiDownload, FiMail, FiCheckCircle,
  FiAlertCircle, FiCalendar, FiUsers, FiEye, FiBook
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { coordinatorAPI, adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './PublishTimetable.css';

const PublishTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBatch, setPreviewBatch] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, timetableRes, coursesRes] = await Promise.all([
        adminAPI.getBatches(),
        coordinatorAPI.getTimetable(),
        coordinatorAPI.getCourses()
      ]);

      const batchData = batchesRes.data.data || [];
      const timetableData = timetableRes.data.data || [];

      // Enrich batches with timetable info
      const enrichedBatches = batchData.map(batch => {
        const batchTimetable = timetableData.filter(t => t.batch?._id === batch._id);
        const publishedCount = batchTimetable.filter(t => t.isPublished).length;
        const unpublishedCount = batchTimetable.filter(t => !t.isPublished).length;

        return {
          ...batch,
          totalSchedules: batchTimetable.length,
          publishedCount,
          unpublishedCount,
          timetable: batchTimetable
        };
      });

      setBatches(enrichedBatches);
      setTimetable(timetableData);
      setCourses(coursesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Toggle batch selection
  const toggleBatchSelection = (batchId) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  // Select all batches with unpublished schedules
  const selectAllUnpublished = () => {
    const unpublishedBatchIds = batches
      .filter(b => b.unpublishedCount > 0)
      .map(b => b._id);
    setSelectedBatches(unpublishedBatchIds);
  };

  // Preview timetable
  const previewTimetable = (batch) => {
    setPreviewBatch(batch);
    setPreviewData(batch.timetable || []);
    setShowPreviewModal(true);
  };

  // Publish timetable
  const handlePublish = async () => {
    if (selectedBatches.length === 0) {
      toast.warning('Please select at least one batch');
      return;
    }

    setPublishing(true);

    try {
      const response = await coordinatorAPI.publishTimetable({
        batches: selectedBatches,
        message: customMessage
      });

      toast.success(response.data.message);
      setSelectedBatches([]);
      setCustomMessage('');
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to publish timetable';
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  // Generate PDF
  const generatePDF = (batch) => {
    const doc = new jsPDF();
    const batchTimetable = batch.timetable || [];

    // Header
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210);
    doc.text('UniSlot - SLIIT Timetable', 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Batch: ${batch.batchCode}`, 14, 32);
    doc.text(`Year ${batch.year} | Semester ${batch.semester} | ${batch.type === 'WD' ? 'Weekday' : 'Weekend'}`, 14, 40);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 48);

    // Group by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let yPos = 60;

    days.forEach(day => {
      const daySchedule = batchTimetable
        .filter(t => t.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (daySchedule.length > 0) {
        // Day header
        doc.setFontSize(14);
        doc.setTextColor(25, 118, 210);
        doc.text(day, 14, yPos);
        yPos += 8;

        // Table
        const tableData = daySchedule.map(schedule => [
          `${schedule.startTime} - ${schedule.endTime}`,
          schedule.course?.courseCode || '',
          schedule.course?.courseName || '',
          schedule.type,
          schedule.instructor?.name || '',
          schedule.hall?.hallCode || '',
          schedule.mode
        ]);

        doc.autoTable({
          startY: yPos,
          head: [['Time', 'Code', 'Course', 'Type', 'Instructor', 'Hall', 'Mode']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [33, 150, 243] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 18 },
            2: { cellWidth: 45 },
            3: { cellWidth: 18 },
            4: { cellWidth: 30 },
            5: { cellWidth: 15 },
            6: { cellWidth: 18 }
          }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Check for page break
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} | © ${new Date().getFullYear()} UniSlot - SLIIT`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save
    doc.save(`Timetable_${batch.batchCode}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  // Get batches with unpublished schedules
  const batchesWithUnpublished = batches.filter(b => b.unpublishedCount > 0);
  const totalUnpublished = batchesWithUnpublished.reduce((sum, b) => sum + b.unpublishedCount, 0);

  if (loading) {
    return <Loading text="Loading..." />;
  }

  return (
    <div className="publish-timetable">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Publish Timetable</h2>
          <p>Review and publish timetables to students via email</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <CardBody>
            <div className="summary-icon primary">
              <FiCalendar size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{batches.length}</span>
              <span className="summary-label">Total Batches</span>
            </div>
          </CardBody>
        </Card>

        <Card className="summary-card">
          <CardBody>
            <div className="summary-icon warning">
              <FiAlertCircle size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{totalUnpublished}</span>
              <span className="summary-label">Unpublished Schedules</span>
            </div>
          </CardBody>
        </Card>

        <Card className="summary-card">
          <CardBody>
            <div className="summary-icon success">
              <FiCheckCircle size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{selectedBatches.length}</span>
              <span className="summary-label">Selected for Publishing</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Read-only course catalog (CRUD: view — manage courses in Admin) */}
      <Card className="course-catalog-card">
        <CardHeader>
          <h3>
            <FiBook size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Active courses
          </h3>
          <span className="course-catalog-count">{courses.length} courses</span>
        </CardHeader>
        <CardBody className="course-catalog-body">
          {courses.length === 0 ? (
            <p className="course-catalog-empty">No courses in the system. Add courses under Admin → Course Management.</p>
          ) : (
            <div className="course-catalog-table-wrap">
              <table className="course-catalog-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Credits</th>
                    <th>Year / Sem</th>
                    <th>Hours (L/T/P)</th>
                    <th>LIC</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c._id}>
                      <td><span className="cc-code">{c.courseCode}</span></td>
                      <td>{c.courseName}</td>
                      <td>{c.credits}</td>
                      <td>Y{c.year} · S{c.semester}</td>
                      <td>
                        {(c.lectureHours || 0)}/{(c.tutorialHours || 0)}/{(c.labHours || 0)}
                      </td>
                      <td>{c.lic?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="publish-layout">
        {/* Batch Selection */}
        <div className="batch-selection">
          <Card>
            <CardHeader>
              <h3>Select Batches to Publish</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={selectAllUnpublished}
              >
                Select All Unpublished
              </Button>
            </CardHeader>
            <CardBody className="no-padding">
              <div className="batch-list">
                {batches.map(batch => (
                  <div 
                    key={batch._id}
                    className={`batch-item ${selectedBatches.includes(batch._id) ? 'selected' : ''}`}
                    onClick={() => batch.unpublishedCount > 0 && toggleBatchSelection(batch._id)}
                  >
                    <div className="batch-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch._id)}
                        onChange={() => toggleBatchSelection(batch._id)}
                        disabled={batch.unpublishedCount === 0}
                      />
                    </div>
                    
                    <div className="batch-info">
                      <span className="batch-code">{batch.batchCode}</span>
                      <div className="batch-meta">
                        <span><FiUsers size={12} /> {batch.studentCount} students</span>
                        <span><FiCalendar size={12} /> {batch.totalSchedules} schedules</span>
                      </div>
                    </div>

                    <div className="batch-status">
                      {batch.unpublishedCount > 0 ? (
                        <Badge variant="warning">{batch.unpublishedCount} unpublished</Badge>
                      ) : (
                        <Badge variant="success">All published</Badge>
                      )}
                    </div>

                    <div className="batch-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewTimetable(batch);
                        }}
                        title="Preview"
                      >
                        <FiEye size={16} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          generatePDF(batch);
                        }}
                        title="Download PDF"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Publish Panel */}
        <div className="publish-panel">
          <Card>
            <CardHeader>
              <h3>Publish Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="publish-content">
                <div className="selected-summary">
                  <h4>Selected Batches ({selectedBatches.length})</h4>
                  {selectedBatches.length === 0 ? (
                    <p className="no-selection">No batches selected</p>
                  ) : (
                    <div className="selected-tags">
                      {selectedBatches.map(batchId => {
                        const batch = batches.find(b => b._id === batchId);
                        return (
                          <span key={batchId} className="selected-tag">
                            {batch?.batchCode}
                            <button onClick={() => toggleBatchSelection(batchId)}>×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="message-section">
                  <label className="form-label">Custom Message (Optional)</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Add a custom message to include in the email..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                  <span className="form-hint">
                    This message will be included in the email sent to students
                  </span>
                </div>

                <div className="email-preview">
                  <h4>Email Preview</h4>
                  <div className="preview-box">
                    <p><strong>Subject:</strong> 📅 Timetable Published - [Batch Code]</p>
                    <p><strong>Content:</strong></p>
                    <ul>
                      <li>Weekly schedule table</li>
                      <li>Instructor details</li>
                      <li>Hall allocations</li>
                      <li>Session modes (Physical/Online)</li>
                      {customMessage && <li>Your custom message</li>}
                    </ul>
                    <p><strong>Attachment:</strong> Timetable PDF</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  icon={<FiSend />}
                  onClick={handlePublish}
                  loading={publishing}
                  disabled={selectedBatches.length === 0}
                  className="publish-btn"
                >
                  Publish & Send Emails
                </Button>

                <p className="publish-note">
                  <FiMail size={14} />
                  Emails will be sent to all students in selected batches
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Timetable Preview - ${previewBatch?.batchCode}`}
        size="xl"
      >
        {previewBatch && (
          <div className="timetable-preview">
            <div className="preview-header">
              <div className="preview-info">
                <Badge variant="primary">{previewBatch.type === 'WD' ? 'Weekday' : 'Weekend'}</Badge>
                <Badge variant="neutral">{previewBatch.specialization}</Badge>
                <span>{previewBatch.studentCount} students</span>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                icon={<FiDownload />}
                onClick={() => generatePDF(previewBatch)}
              >
                Download PDF
              </Button>
            </div>

            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Instructor</th>
                    <th>Hall</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData
                    .sort((a, b) => {
                      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                      if (dayDiff !== 0) return dayDiff;
                      return a.startTime.localeCompare(b.startTime);
                    })
                    .map((schedule, idx) => (
                      <tr key={idx}>
                        <td>{schedule.day}</td>
                        <td>{schedule.startTime} - {schedule.endTime}</td>
                        <td>
                          <span className="course-code">{schedule.course?.courseCode}</span>
                          <br />
                          <span className="course-name">{schedule.course?.courseName}</span>
                        </td>
                        <td>
                          <Badge variant="primary">{schedule.type}</Badge>
                        </td>
                        <td>{schedule.instructor?.name}</td>
                        <td>{schedule.hall?.hallCode}</td>
                        <td>
                          <Badge variant={schedule.mode === 'online' ? 'success' : 'neutral'}>
                            {schedule.mode}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={schedule.isPublished ? 'success' : 'warning'}>
                            {schedule.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PublishTimetable;