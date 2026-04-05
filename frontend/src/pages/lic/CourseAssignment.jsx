import React from 'react';
import { FiBook } from 'react-icons/fi';
import StaffSelection from './StaffSelection';
import './CourseAssignment.css';

const CourseAssignment = () => {
  return (
    <div className="course-assignment-page">
      <header className="course-assignment-page__header">
        <div className="course-assignment-page__icon-wrap" aria-hidden>
          <FiBook className="course-assignment-page__icon" />
        </div>
        <div>
          <h2 className="course-assignment-page__title">Course assignment</h2>
          <p className="course-assignment-page__subtitle">
            View courses assigned to you, pick instructors with priorities, check workload, and submit to the coordinator.
          </p>
        </div>
      </header>
      <StaffSelection />
    </div>
  );
};

export default CourseAssignment;
