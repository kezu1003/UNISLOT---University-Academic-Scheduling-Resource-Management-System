import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, action, className = '' }) => (
  <div className={`card-header ${className}`}>
    <div className="card-header-content">{children}</div>
    {action && <div className="card-header-action">{action}</div>}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;