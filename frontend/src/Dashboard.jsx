import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddChildModal from "./components/AddChildModal.jsx";
import { supabase } from "./lib/supabase";
import { getChildren, addChild, deleteChild } from "./lib/children";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState("overview");

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const loadUserDataAndChildren = async () => {
    setLoadingChildren(true);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        navigate("/login", { replace: true });
        return;
      }

      setUserProfile(data.session.user);

      const records = await getChildren();
      setChildren(records);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error(error.message || "Could not load child profiles.");
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    loadUserDataAndChildren();
  }, []);

  const handleChildAdded = async (childDetails) => {
    try {
      const savedChild = await addChild(childDetails);
      setChildren((previous) => [savedChild, ...previous]);
      toast.success("Child profile created successfully!");
      closeModal();
    } catch (error) {
      console.error("Error saving child:", error);
      toast.error(error.message || "Could not save child profile.");
    }
  };

  const handleChildDeleted = async (childId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this child profile?",
    );

    if (!confirmed) return;

    try {
      await deleteChild(childId);
      setChildren((previous) =>
        previous.filter((child) => child.id !== childId),
      );
      toast.success("Child profile removed.");
    } catch (error) {
      console.error("Error deleting child:", error);
      toast.error(error.message || "Could not delete child profile.");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.info("Signed out successfully.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Error signing out.");
    }
  };

  const parentName =
    userProfile?.user_metadata?.full_name || userProfile?.email || "Parent";

  const sidebarItems = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "children", label: "My Children", icon: "👶" },
    { key: "analytics", label: "Analytics", icon: "📈" },
    { key: "reports", label: "Reports", icon: "📄" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  const stats = [
    { label: "Total Children", value: children.length, trend: null },
    { label: "Sessions Completed", value: children.length * 3, trend: "+12%" },
    {
      label: "Avg. Score",
      value: children.length > 0 ? "87%" : "—",
      trend: "+5%",
    },
    {
      label: "Hours Played",
      value: children.length > 0 ? "4.2h" : "0h",
      trend: "+8%",
    },
  ];

  return (
    <div className="dash">
      <ToastContainer position="top-right" autoClose={4000} />

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
              className={`dash-nav-item ${
                activeSidebarItem === item.key ? "dash-nav-item--active" : ""
              }`}
              onClick={() => setActiveSidebarItem(item.key)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span className="dash-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user">
            <div className="dash-user-avatar">
              {parentName.charAt(0).toUpperCase()}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">{parentName}</span>
              <span className="dash-user-role">Guardian</span>
            </div>
          </div>
          <button className="dash-logout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div>
            <h1 className="dash-greeting">Welcome back, {parentName}! 👋</h1>
            <p className="dash-subgreeting">
              Here's what's happening with your children's learning journey.
            </p>
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
                <span className="dash-analytics-btn-title">
                  Progress Report
                </span>
                <span className="dash-analytics-btn-desc">
                  Track learning milestones
                </span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>

            <button className="dash-analytics-btn dash-analytics-btn--reading">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">
                  Reading Analysis
                </span>
                <span className="dash-analytics-btn-desc">
                  Phonics & comprehension stats
                </span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>

            <button className="dash-analytics-btn dash-analytics-btn--screening">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">
                  Screening Results
                </span>
                <span className="dash-analytics-btn-desc">
                  Detailed assessment overview
                </span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>

            <button className="dash-analytics-btn dash-analytics-btn--export">
              <div className="dash-analytics-btn-content">
                <span className="dash-analytics-btn-title">Export Data</span>
                <span className="dash-analytics-btn-desc">
                  Download reports as PDF
                </span>
              </div>
              <span className="dash-analytics-btn-arrow">→</span>
            </button>
          </div>
        </section>

        {/* Children section */}
        <section className="dash-children-section">
          <h2 className="dash-section-title">My Children</h2>

          {loadingChildren ? (
            <p>Loading child profiles...</p>
          ) : (
            <div className="dash-children-grid">
              {children.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">🌿</div>
                  <h3 className="dash-empty-title">No child profiles yet</h3>
                  <p className="dash-empty-text">
                    Click "+ Add Child" to begin your child's learning
                    adventure.
                  </p>
                  <button className="dash-empty-btn" onClick={openModal}>
                    + Add Your First Child
                  </button>
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
                      <button className="dash-child-action">
                        View Progress
                      </button>
                      <button
                        onClick={() => navigate("/game")}
                        className="dash-child-action dash-child-action--play"
                      >
                        ▶ Play
                      </button>
                      <button
                        className="dash-child-action"
                        onClick={() => handleChildDeleted(child.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
