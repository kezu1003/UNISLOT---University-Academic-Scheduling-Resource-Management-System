import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ── Request Interceptor ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────
// ✅ FIX: Only redirect on 401 for /auth/me (token truly expired)
// Dashboard API calls (timetable, workload etc.) failing 
// should NOT force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url || '';
    const isLogin = window.location.pathname === '/login';

    // Only auto-logout when token is truly invalid (auth/me fails)
    // NOT when dashboard data APIs return 401
    if (
      status === 401 &&
      !isLogin &&
      (url.includes('/auth/me') || url.includes('/auth/login'))
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// ==================== ADMIN ====================
export const adminAPI = {
  // Staff
  uploadStaff: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/staff/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getStaff:    (params)     => api.get('/admin/staff',        { params }),
  createStaff: (data)       => api.post('/admin/staff',       data),
  updateStaff: (id, data)   => api.put(`/admin/staff/${id}`,  data),
  deleteStaff: (id)         => api.delete(`/admin/staff/${id}`),

  // Batches
  getBatches:    (params)   => api.get('/admin/batches',         { params }),
  createBatch:   (data)     => api.post('/admin/batches',        data),
  updateBatch:   (id, data) => api.put(`/admin/batches/${id}`,   data),
  deleteBatch:   (id)       => api.delete(`/admin/batches/${id}`),

  // Halls
  getHalls:    (params)     => api.get('/admin/halls',           { params }),
  createHall:  (data)       => api.post('/admin/halls',          data),
  updateHall:  (id, data)   => api.put(`/admin/halls/${id}`,     data),
  deleteHall:  (id)         => api.delete(`/admin/halls/${id}`),

  // Courses
  getCourses:    (params)   => api.get('/admin/courses',         { params }),
  getCourse:     (id)       => api.get(`/admin/courses/${id}`),
  createCourse:  (data)     => api.post('/admin/courses',        data),
  updateCourse:  (id, data) => api.put(`/admin/courses/${id}`,   data),
  deleteCourse:  (id)       => api.delete(`/admin/courses/${id}`)
};

// ==================== LIC ====================
export const licAPI = {
  getCourses:       ()          => api.get('/lic/courses'),
  getStaff:         (params)    => api.get('/lic/staff',                   { params }),
  assignInstructors:(courseId, data) =>
                                   api.put(`/lic/courses/${courseId}/instructors`, data),
  getStaffWorkload: (staffId)   => api.get(`/lic/staff/${staffId}/workload`)
};

// ==================== COORDINATOR ====================
export const coordinatorAPI = {
  // Timetable
  getTimetable:    (params)   => api.get('/coordinator/timetable',          { params }),
  createTimetable: (data)     => api.post('/coordinator/timetable',         data),
  updateTimetable: (id, data) => api.put(`/coordinator/timetable/${id}`,    data),
  deleteTimetable: (id)       => api.delete(`/coordinator/timetable/${id}`),
  publishTimetable:(data)     => api.post('/coordinator/timetable/publish', data),
  getConflicts:    ()         => api.get('/coordinator/timetable/conflicts'),

  // Workload
  getAllWorkload:   (params)   => api.get('/coordinator/workload',           { params }),
  getStaffWorkload:(staffId)  => api.get(`/coordinator/workload/${staffId}`),

  // Courses
  getCourses:      (params)   => api.get('/coordinator/courses',            { params }),
  getCourse:       (id)       => api.get(`/coordinator/courses/${id}`)
};

export default api;