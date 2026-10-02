import React, { useState } from 'react';
import AddChildModal from './components/AddChildModal.jsx';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChildAdded = (newChild) => {
    setChildren((prev) => [...prev, newChild]);
  };

  const sidebarItems = [
    { key: 'overview', label: 'Overview', icon: '' },
    { key: 'children', label: 'My Children', icon: '' },
    { key: 'analytics', label: 'Analytics', icon: '' },
    { key: 'reports', label: 'Reports', icon: '' },
    { key: 'settings', label: 'Settings', icon: '' },
  ];

  const stats = [
    { label: 'Total Children', value: children.length, trend: null },
    { label: 'Sessions Completed', value: children.length * 3, trend: '+12%' },
    { label: 'Avg. Score', value: children.length > 0 ? '87%' : '—', trend: '+5%' },
    { label: 'Hours Played', value: children.length > 0 ? '4.2h' : '0h', trend: '+8%' },
  ];

  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <span className="dash-sidebar-logo-icon">🌱</span>
          <span className="dash-sidebar-logo-text">MindBloom</span>
        </div>

        <nav className="dash-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`dash-nav-item ${activeSidebarItem === item.key ? 'dash-nav-item--active' : ''}`}
              onClick={() => setActiveSidebarItem(item.key)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span className="dash-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user">
            <div className="dash-user-avatar">P</div>
            <div className="dash-user-info">
              <span className="dash-user-name">Parent</span>
              <span className="dash-user-role">Guardian</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div>
            <h1 className="dash-greeting">Welcome back, Parent! </h1>
            <p className="dash-subgreeting">Here's what's happening with your children's learning journey.</p>
          </div>
          <button className="dash-add-btn" onClick={openModal}>
            <span className="dash-add-btn-icon">+</span>
            Add Child
          </button>
        </header>

        {/* Stats cards */}
        <section className="dash-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="dash-stat-card">
              <div className="dash-stat-icon">{stat.icon}</div>
              <div className="dash-stat-info">
                <span className="dash-stat-value">{stat.value}</span>
                <span className="dash-stat-label">{stat.label}</span>
              </div>
              {stat.trend && (
                <span className="dash-stat-trend">{stat.trend}</span>
              )}
            </div>
          ))}
        </section>

        {/* Analytics quick-actions */}
        <section className="dash-analytics">
          <h2 className="dash-section-title">Analytics & Insights</h2>
          <div className="dash-analytics-grid">
            <button className="dash-analytics-btn dash-analytics-btn--progress">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">Progress Report</span>
                <span className="dash-analytics-btn-desc">Track learning milestones</span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>

            <button className="dash-analytics-btn dash-analytics-btn--reading">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">Reading Analysis</span>
                <span className="dash-analytics-btn-desc">Phonics & comprehension stats</span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>

            <button className="dash-analytics-btn dash-analytics-btn--screening">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">Screening Results</span>
                <span className="dash-analytics-btn-desc">Detailed assessment overview</span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>

            <button className="dash-analytics-btn dash-analytics-btn--export">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">Export Data</span>
                <span className="dash-analytics-btn-desc">Download reports as PDF</span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>
          </div>
        </section>

        {/* Children section */}
        <section className="dash-children-section">
          <h2 className="dash-section-title">My Children</h2>
          <div className="dash-children-grid">
            {children.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">🌿</div>
                <h3 className="dash-empty-title">No child profiles yet</h3>
                <p className="dash-empty-text">Click "+ Add Child" to begin your child's learning adventure.</p>
                <button className="dash-empty-btn" onClick={openModal}>+ Add Your First Child</button>
              </div>
            ) : (
              children.map((child) => (
                <div key={child.id} className="dash-child-card">
                  <div className="dash-child-avatar">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="dash-child-name">{child.name}</h3>
                  <p className="dash-child-age">{child.age} years old</p>
                  {child.fileName && (
                    <p className="dash-child-file">📄 {child.fileName}</p>
                  )}
                  <div className="dash-child-actions">
                    <button className="dash-child-action">View Progress</button>
                    <button onClick={() => navigate('/game')}className="dash-child-action dash-child-action--play">▶ Play</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <AddChildModal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        onChildAdded={handleChildAdded}
      />
    </div>
  );
}
