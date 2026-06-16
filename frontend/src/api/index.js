import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// ── Response interceptor for uniform error shape ─────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── Students ─────────────────────────────────────────────────
export const fetchStudents = (params = {}) =>
  api.get('/students', { params });

export const fetchStudent = (id) =>
  api.get(`/students/${id}`);

export const createStudent = (data) =>
  api.post('/students', data);

export const updateStudent = (id, data) =>
  api.put(`/students/${id}`, data);

export const deleteStudent = (id) =>
  api.delete(`/students/${id}`);

// ── Marks ────────────────────────────────────────────────────
export const fetchMarks = (studentId) =>
  api.get(`/students/${studentId}/marks`);

export const addMark = (studentId, data) =>
  api.post(`/students/${studentId}/marks`, data);

export const updateMark = (markId, data) =>
  api.put(`/marks/${markId}`, data);

export const deleteMark = (markId) =>
  api.delete(`/marks/${markId}`);

// ── Subjects ─────────────────────────────────────────────────
export const fetchSubjects = () =>
  api.get('/subjects');
