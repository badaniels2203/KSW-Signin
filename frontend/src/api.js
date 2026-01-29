import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

// Students
export const searchStudents = (query) =>
  api.get('/students/search', { params: { query } });

export const getStudents = (params) =>
  api.get('/students', { params });

export const getStudent = (id) =>
  api.get(`/students/${id}`);

export const createStudent = (data) =>
  api.post('/students', data);

export const updateStudent = (id, data) =>
  api.put(`/students/${id}`, data);

export const deleteStudent = (id) =>
  api.delete(`/students/${id}`);

// Attendance
export const logAttendance = (student_id) =>
  api.post('/attendance', { student_id });

export const getAttendance = (params) =>
  api.get('/attendance', { params });

export const getAttendanceReport = (params) =>
  api.get('/attendance/report/by-student', { params });

export const getAttendanceStats = (params) =>
  api.get('/attendance/stats', { params });

export const getOverAttendanceReport = (params) =>
  api.get('/attendance/report/over-attendance', { params });

export const getAgeTransitionsReport = (params) =>
  api.get('/attendance/report/age-transitions', { params });

export const deleteAttendance = (id) =>
  api.delete(`/attendance/${id}`);

export default api;
