import React, { useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiUsers,
  FiXCircle
} from 'react-icons/fi';
import './HallAvailabilityPanel.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HALL_TYPES = ['all', 'Lecture Hall', 'Lab', 'Tutorial Room'];

const HallAvailabilityPanel = ({
  title = 'Hall Availability',
  description = 'Check which halls or labs are free for a selected time slot.',
  fetchAvailability,
  initialFilters = {},
  batchId,
  batchSize,
  selectedHallId,
  onSelectHall,
  compact = false
}) => {
  const [filters, setFilters] = useState({
    day: initialFilters.day || 'Monday',
    startTime: initialFilters.startTime || '08:00',
    endTime: initialFilters.endTime || '10:00',
    type: initialFilters.type || 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      day: initialFilters.day || prev.day,
      startTime: initialFilters.startTime || prev.startTime,
      endTime: initialFilters.endTime || prev.endTime
    }));
  }, [initialFilters.day, initialFilters.endTime, initialFilters.startTime]);

  const canSearch = useMemo(() => {
    return Boolean(filters.day && filters.startTime && filters.endTime);
  }, [filters.day, filters.endTime, filters.startTime]);

  const runSearch = async () => {
    if (!canSearch || !fetchAvailability) return;

    if (filters.endTime <= filters.startTime) {
      setAvailability(null);
      setError('End time must be later than start time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchAvailability({
        day: filters.day,
        startTime: filters.startTime,
        endTime: filters.endTime,
        type: filters.type !== 'all' ? filters.type : undefined,
        batchId: batchId || undefined
      });

      setAvailability(response.data?.data || null);
    } catch (err) {
      setAvailability(null);
      setError(err.response?.data?.message || 'Failed to fetch hall availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
  }, [filters.day, filters.endTime, filters.startTime, filters.type, batchId]);

  const availableHalls = availability?.halls?.filter((hall) => hall.isAvailable) || [];
  const unavailableHalls = availability?.halls?.filter((hall) => !hall.isAvailable) || [];

  return (
    <div className={`hall-availability-panel ${compact ? 'compact' : ''}`}>
      <div className="hall-availability-header">
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className="availability-refresh-btn"
          onClick={runSearch}
          disabled={loading || !canSearch}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      <div className="availability-filter-grid">
        <label>
          <span><FiCalendar size={14} /> Day</span>
          <select
            value={filters.day}
            onChange={(e) => setFilters((prev) => ({ ...prev, day: e.target.value }))}
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </label>

        <label>
          <span><FiClock size={14} /> Start Time</span>
          <input
            type="time"
            value={filters.startTime}
            onChange={(e) => setFilters((prev) => ({ ...prev, startTime: e.target.value }))}
          />
        </label>

        <label>
          <span><FiClock size={14} /> End Time</span>
          <input
            type="time"
            value={filters.endTime}
            onChange={(e) => setFilters((prev) => ({ ...prev, endTime: e.target.value }))}
          />
        </label>

        <label>
          <span><FiMapPin size={14} /> Type</span>
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          >
            {HALL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </label>
      </div>

      {batchSize ? (
        <div className="availability-batch-note">
          <FiUsers />
          <span>Comparing hall capacity against {batchSize} students.</span>
        </div>
      ) : null}

      {error ? (
        <div className="availability-message error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="availability-message">
          <FiRefreshCw className="spin" />
          <span>Checking hall availability...</span>
        </div>
      ) : null}

      {!loading && availability ? (
        <>
          <div className="availability-summary-grid">
            <div className="availability-stat">
              <strong>{availability.summary?.total || 0}</strong>
              <span>Total</span>
            </div>
            <div className="availability-stat success">
              <strong>{availability.summary?.available || 0}</strong>
              <span>Available</span>
            </div>
            <div className="availability-stat danger">
              <strong>{availability.summary?.unavailable || 0}</strong>
              <span>Occupied</span>
            </div>
            {availability.batch ? (
              <div className="availability-stat info">
                <strong>{availability.summary?.suitableForBatch || 0}</strong>
                <span>Fit Batch</span>
              </div>
            ) : null}
          </div>

          <div className="availability-lists">
            <div className="availability-list-card">
              <div className="availability-list-header success">
                <FiCheckCircle />
                <span>Available Halls / Labs</span>
              </div>
              {availableHalls.length === 0 ? (
                <p className="availability-empty">No free halls found for this slot.</p>
              ) : (
                <div className="availability-items">
                  {availableHalls.map((hall) => {
                    const isSelected = selectedHallId === hall._id;
                    const disabledForBatch = availability.batch && !hall.canFitBatch;

                    return (
                      <div key={hall._id} className={`availability-item ${isSelected ? 'selected' : ''}`}>
                        <div className="availability-item-main">
                          <div className="availability-item-title">
                            <strong>{hall.hallCode}</strong>
                            <span>{hall.hallName}</span>
                          </div>
                          <div className="availability-item-meta">
                            <span>{hall.type}</span>
                            <span>{hall.location}</span>
                            <span>{hall.capacity} seats</span>
                          </div>
                          {availability.batch && disabledForBatch ? (
                            <p className="availability-warning">
                              Too small by {hall.capacityShortfall} seats for {availability.batch.batchCode}
                            </p>
                          ) : null}
                        </div>
                        {onSelectHall ? (
                          <button
                            type="button"
                            className="availability-select-btn"
                            onClick={() => onSelectHall(hall)}
                            disabled={disabledForBatch}
                          >
                            {isSelected ? 'Selected' : 'Use Hall'}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="availability-list-card">
              <div className="availability-list-header danger">
                <FiXCircle />
                <span>Occupied Halls / Labs</span>
              </div>
              {unavailableHalls.length === 0 ? (
                <p className="availability-empty">No hall is occupied for this slot.</p>
              ) : (
                <div className="availability-items">
                  {unavailableHalls.map((hall) => (
                    <div key={hall._id} className="availability-item unavailable">
                      <div className="availability-item-main">
                        <div className="availability-item-title">
                          <strong>{hall.hallCode}</strong>
                          <span>{hall.hallName}</span>
                        </div>
                        <div className="availability-item-meta">
                          <span>{hall.type}</span>
                          <span>{hall.location}</span>
                          <span>{hall.capacity} seats</span>
                        </div>
                        <div className="availability-conflicts">
                          {hall.conflictingEntries.map((entry) => (
                            <p key={entry.id}>
                              {entry.courseCode} | {entry.batchCode} | {entry.startTime}-{entry.endTime}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default HallAvailabilityPanel;



