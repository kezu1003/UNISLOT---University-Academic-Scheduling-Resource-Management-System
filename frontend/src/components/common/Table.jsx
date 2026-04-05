import React from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import Loading from './Loading';
import './Table.css';

const Table = ({
  columns,
  data = [],
  loading = false,
  sortField = null,
  sortOrder = 'asc',
  onSort = () => {},
  emptyMessage = 'No data available',
  onRowClick
}) => {
  const handleSort = (field) => {
    if (sortField === field) {
      onSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  if (loading) {
    return (
      <div className="table-container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.sortable ? 'sortable' : ''}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="th-content">
                  <span>{col.title}</span>
                  {col.sortable && sortField === col.key && (
                    <span className="sort-icon">
                      {sortOrder === 'asc' ? (
                        <FiChevronUp size={14} />
                      ) : (
                        <FiChevronDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-row">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row._id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;