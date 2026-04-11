import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

/* ─── Route → Page Title map ──────────────────────── */
const ROUTE_TITLES = [
  // Admin
  { path: '/admin/staff',              title: 'Staff Management'    },
  { path: '/admin/batches',            title: 'Batch Management'    },
  { path: '/admin/courses',            title: 'Course Management'   },
  { path: '/admin/halls',              title: 'Hall Management'     },
  { path: '/admin/profile',            title: 'My Profile'          },
  { path: '/admin/settings',           title: 'Settings'            },
  { path: '/admin',                    title: 'Admin Dashboard'     },

  // LIC
  { path: '/lic/courses',              title: 'My Courses'          },
  { path: '/lic/assign',               title: 'Assign Instructors'  },
  { path: '/lic/workload',             title: 'Staff Workload'      },
  { path: '/lic/profile',              title: 'My Profile'          },
  { path: '/lic/settings',             title: 'Settings'            },
  { path: '/lic',                      title: 'LIC Dashboard'       },

  // Coordinator
  { path: '/coordinator/timetable',    title: 'Timetable View'      },
  { path: '/coordinator/schedule',     title: 'Schedule Classes'    },
  { path: '/coordinator/workload',     title: 'Workload Overview'   },
  { path: '/coordinator/conflicts',    title: 'Conflict Check'      },
  { path: '/coordinator/publish',      title: 'Publish Timetable'   },
  { path: '/coordinator/profile',      title: 'My Profile'          },
  { path: '/coordinator/settings',     title: 'Settings'            },
  { path: '/coordinator',              title: 'Coordinator Dashboard'},
];

const getPageTitle = (pathname) => {
  // exact match first, then startsWith (longer paths first)
  const sorted = [...ROUTE_TITLES].sort(
    (a, b) => b.path.length - a.path.length
  );
  const match = sorted.find((r) => pathname.startsWith(r.path));
  return match?.title || 'Dashboard';
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="layout">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          title={pageTitle}
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;