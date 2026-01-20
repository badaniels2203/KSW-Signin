import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStudents, logAttendance } from '../api';
import './SignIn.css';

function SignIn() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setStudents([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await searchStudents(searchQuery);
      setStudents(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (student) => {
    try {
      setLoading(true);
      const response = await logAttendance(student.id);
      setMessage(`✓ ${student.name} signed in successfully!`);
      setMessageType('success');
      setSearchQuery('');
      setStudents([]);

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      if (error.response?.status === 409) {
        setMessage(`${student.name} has already signed in today!`);
        setMessageType('warning');
      } else {
        setMessage('Error signing in. Please try again.');
        setMessageType('error');
      }

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
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

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="logo-container">
          <img src="/logo.png" alt="KSW Logo" className="signin-logo" />
        </div>
        <h1 className="signin-title">KSW Martial Arts</h1>
        <h2 className="signin-subtitle">Student Sign-In</h2>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Type your name to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            autoFocus
          />
          {loading && <div className="search-spinner">🔍</div>}
        </div>

        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}

        {students.length > 0 && (
          <div className="students-list">
            {students.map((student) => (
              <button
                key={student.id}
                className="student-item"
                onClick={() => handleSignIn(student)}
                disabled={loading}
              >
                <div className="student-name">{student.name}</div>
                <div
                  className="student-category"
                  style={{ backgroundColor: getCategoryColor(student.class_category) }}
                >
                  {student.class_category}
                </div>
              </button>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && students.length === 0 && !loading && (
          <div className="no-results">No students found</div>
        )}

        <button
          className="admin-link"
          onClick={() => navigate('/admin/login')}
        >
          Admin Portal
        </button>
      </div>
    </div>
  );
}

export default SignIn;
