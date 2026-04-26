import React from 'react';

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;