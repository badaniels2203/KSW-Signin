import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAttendanceReport,
  getAttendanceStats,
  getAttendance,
  getOverAttendanceReport,
  deleteAttendance,
  getAgeTransitionsReport,
  changePassword,
} from '../api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    class_category: 'Little Lions',
    monthly_lessons: 8,
    date_of_birth: '',
    active: true,
  });
  const [reportData, setReportData] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [overAttendanceData, setOverAttendanceData] = useState([]);
  const [ageTransitionsData, setAgeTransitionsData] = useState([]);
  const [reportMonth, setReportMonth] = useState('');
  const [reportYear, setReportYear] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
    } else {
      loadStudents();
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'reports') {
      const now = new Date();
      setReportMonth((now.getMonth() + 1).toString());
      setReportYear(now.getFullYear().toString());
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'reports' && reportMonth && reportYear) {
      loadReportData();
    }
  }, [activeTab, reportMonth, reportYear, categoryFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getStudents({ active: true });
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const params = {
        month: reportMonth,
        year: reportYear,
      };
      if (categoryFilter) {
        params.category = categoryFilter;
      }

      const [reportResponse, statsResponse, attendanceResponse, overAttendanceResponse, ageTransitionsResponse] = await Promise.all([
        getAttendanceReport(params),
        getAttendanceStats(params),
        getAttendance(params),
        getOverAttendanceReport({ month: reportMonth, year: reportYear }),
        getAgeTransitionsReport({ month: reportMonth, year: reportYear }),
      ]);

      setReportData(reportResponse.data);
      setStatsData(statsResponse.data);
      setAttendanceData(attendanceResponse.data);
      setOverAttendanceData(overAttendanceResponse.data);
      setAgeTransitionsData(ageTransitionsResponse.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        registration_number: student.registration_number || '',
        class_category: student.class_category,
        monthly_lessons: student.monthly_lessons || 8,
        date_of_birth: student.date_of_birth || '',
        active: student.active,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        registration_number: '',
        class_category: 'Little Lions',
        monthly_lessons: 8,
        date_of_birth: '',
        active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      registration_number: '',
      class_category: 'Little Lions',
      monthly_lessons: 8,
      date_of_birth: '',
      active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
      } else {
        await createStudent(formData);
      }
      await loadStudents();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving student:', error);
      alert(error.response?.data?.error || 'Error saving student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this student?')) {
      try {
        setLoading(true);
        await deleteStudent(id);
        await loadStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        setLoading(true);
        await deleteAttendance(id);
        await loadReportData();
      } catch (error) {
        console.error('Error deleting attendance:', error);
        alert('Error deleting attendance record.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenPasswordModal = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await changePassword(passwordFormData.currentPassword, passwordFormData.newPassword);
      alert('Password changed successfully');
      handleClosePasswordModal();
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.error || 'Error changing password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Little Lions': '#FFB84D',
      'Juniors': '#4CAF50',
      'Youths': '#2196F3',
      'Adults': '#9C27B0',
    };
    return colors[category] || '#666';
  };

  // Group students by class category for display
  const groupStudentsByCategory = (students) => {
    const categories = ['Little Lions', 'Juniors', 'Youths', 'Adults'];
    const grouped = {};
    
    categories.forEach(cat => {
      grouped[cat] = students.filter(s => s.class_category === cat).sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  };

  const renderStudentsTab = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Student Management</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add Student
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="students-grid">
          {students.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-card-header">
                <h3>{student.name}</h3>
                {student.registration_number && (
                  <div className="student-reg-number">Reg: {student.registration_number}</div>
                )}
                <span
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(student.class_category) }}
                >
                  {student.class_category}
                </span>
                <div className="student-lessons">
                  {student.monthly_lessons || 8} lessons/month
                </div>
                {student.testing_age_range && (
                  <div className="student-age-range">
                    Testing Age: {student.testing_age_range}
                  </div>
                )}
              </div>
              <div className="student-card-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleOpenModal(student)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(student.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReportsTab = () => {
    const groupedReport = groupStudentsByCategory(reportData);
    
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2>Attendance Reports</h2>
        </div>

        <div className="report-filters">
          <div className="filter-group">
            <label>Month</label>
            <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year</label>
            <select value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Little Lions">Little Lions</option>
              <option value="Juniors">Juniors</option>
              <option value="Youths">Youths</option>
              <option value="Adults">Adults</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading report...</div>
        ) : (
          <>
            <div className="stats-grid">
              {statsData.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div
                    className="stat-category"
                    style={{ backgroundColor: getCategoryColor(stat.class_category) }}
                  >
                    {stat.class_category}
                  </div>
                  <div className="stat-value">{stat.total_students}</div>
                  <div className="stat-label">Students</div>
                  <div className="stat-value">{stat.total_attendances || 0}</div>
                  <div className="stat-label">Total Classes</div>
                  <div className="stat-value">
                    {stat.avg_classes_per_student || 0}
                  </div>
                  <div className="stat-label">Avg per Student</div>
                </div>
              ))}
            </div>

            {/* Over-Attendance Warning Section */}
            {overAttendanceData.length > 0 && (
              <>
                <h3 className="section-title warning-title">
                  ⚠️ Students Over Monthly Limit ({overAttendanceData.length})
                </h3>
                <div className="over-attendance-notice">
                  These students have attended more classes than their monthly allocation.
                </div>
                <div className="report-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Reg #</th>
                        <th>Category</th>
                        <th>Monthly Limit</th>
                        <th>Attended</th>
                        <th>Over By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overAttendanceData.map((record) => (
                        <tr key={record.id} className="over-attendance-row">
                          <td><strong>{record.name}</strong></td>
                          <td>{record.registration_number || 'N/A'}</td>
                          <td>
                            <span
                              className="category-badge-small"
                              style={{ backgroundColor: getCategoryColor(record.class_category) }}
                            >
                              {record.class_category}
                            </span>
                          </td>
                          <td>{record.monthly_lessons}</td>
                          <td><strong>{record.total_attended}</strong></td>
                          <td className="over-by-cell">
                            <span className="over-by-badge">+{record.over_by}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Age Range Transitions Section */}
            {ageTransitionsData.length > 0 && (
              <>
                <h3 className="section-title warning-title">
                  🎂 Testing Age Range Transitions ({ageTransitionsData.length})
                </h3>
                <div className="over-attendance-notice" style={{ background: '#d1ecf1', border: '2px solid #17a2b8', color: '#0c5460' }}>
                  These students are changing testing age ranges this month.
                </div>
                <div className="report-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Reg #</th>
                        <th>Category</th>
                        <th>Birthday</th>
                        <th>Turning Age</th>
                        <th>Current Range</th>
                        <th>New Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ageTransitionsData.map((record) => (
                        <tr key={record.id} style={{ background: '#d1ecf1' }}>
                          <td><strong>{record.name}</strong></td>
                          <td>{record.registration_number || 'N/A'}</td>
                          <td>
                            <span
                              className="category-badge-small"
                              style={{ backgroundColor: getCategoryColor(record.class_category) }}
                            >
                              {record.class_category}
                            </span>
                          </td>
                          <td>{new Date(record.birthday_date).toLocaleDateString()}</td>
                          <td><strong>{record.turning_age}</strong></td>
                          <td>{record.current_age_range}</td>
                          <td><strong>{record.new_age_range}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h3 className="section-title">Student Attendance by Class</h3>
            {Object.entries(groupedReport).map(([category, students]) => (
              students.length > 0 && (
                <div key={category} className="category-section">
                  <h4 className="category-heading">
                    <span
                      className="category-badge"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    >
                      {category}
                    </span>
                    <span className="category-count">({students.length} students)</span>
                  </h4>
                  <div className="report-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Reg #</th>
                          <th>Classes Attended</th>
                          <th>Monthly Limit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((record) => (
                          <tr key={record.id}>
                            <td>{record.name}</td>
                            <td>{record.registration_number || 'N/A'}</td>
                            <td><strong>{record.total_classes}</strong></td>
                            <td>{record.monthly_lessons || 8}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}

            <h3 className="section-title">Recent Attendance Records</h3>
            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.slice(0, 50).map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.attendance_date).toLocaleDateString()}</td>
                      <td>{record.name}</td>
                      <td>
                        <span
                          className="category-badge-small"
                          style={{ backgroundColor: getCategoryColor(record.class_category) }}
                        >
                          {record.class_category}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-delete-small"
                          onClick={() => handleDeleteAttendance(record.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <img src="/logo.png" alt="KSW Logo" />
        </div>
        <h1>KSW Admin Portal</h1>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Student Sign-In
          </button>
          <button className="btn-secondary" onClick={handleOpenPasswordModal}>
            Change Password
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'students' && renderStudentsTab()}
        {activeTab === 'reports' && renderReportsTab()}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label>Class Category *</label>
                <select
                  value={formData.class_category}
                  onChange={(e) =>
                    setFormData({ ...formData, class_category: e.target.value })
                  }
                  required
                >
                  <option value="Little Lions">Little Lions</option>
                  <option value="Juniors">Juniors</option>
                  <option value="Youths">Youths</option>
                  <option value="Adults">Adults</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monthly Lessons *</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.monthly_lessons}
                  onChange={(e) => setFormData({ ...formData, monthly_lessons: parseInt(e.target.value) || 8 })}
                  required
                />
                <small>Number of classes per month this student is enrolled for</small>
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  placeholder="Optional"
                />
                <small>Used to calculate testing age range</small>
              </div>

              {editingStudent && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                    />
                    Active
                  </label>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  required
                  minLength="6"
                />
                <small>Must be at least 6 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleClosePasswordModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
