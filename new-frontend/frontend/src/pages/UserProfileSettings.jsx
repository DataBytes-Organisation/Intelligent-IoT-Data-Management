import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  Circle,
  Bell,
  Palette,
  Shield,
  Lock,
  Monitor,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Eye,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import './UserProfileSettings.css';

const UserProfileSettings = () => {
  const [selectedTheme, setSelectedTheme] = useState('dark');

  const [notifications, setNotifications] = useState({
    email: true,
    dashboard: true,
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="profile-settings-page">
      <div className="profile-settings-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <h1>User Profile & Settings</h1>
      </div>

      <div className="settings-grid">
        {/* User Profile */}
        <section className="settings-card profile-card">
          <h2>User Profile</h2>

          <div className="avatar-circle">
            <User size={48} />
          </div>

          <h1>UserName</h1>

          <div className="profile-info">
            <p>
              <Mail size={16} />
              username@gmail.com
            </p>

            <p>
              <Phone size={16} />
              +61 00000 0000
            </p>

            <p>
              <Building2 size={16} />
              Company
            </p>

            <p>
              <Circle size={16} className="status-icon" />
              Account Status: Active
            </p>
          </div>

          <button className="outline-btn">Edit Profile</button>
        </section>

        {/* Edit Profile */}
        <section className="settings-card">
          <div className="card-title">
            <User size={18} />
            <h2>Edit Profile</h2>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" defaultValue="UserName" />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" defaultValue="username@gmail" />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" defaultValue="+61 00000 0000" />
            </div>

            <div className="form-group">
              <label>Organization</label>
              <input type="text" defaultValue="Company" />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Profile Picture</label>
            <input type="file" />
            <small>JPG, PNG up to 2MB</small>
          </div>

          <div className="button-row">
            <button className="primary-btn">Save Changes</button>
          </div>
        </section>

        {/* Change Password */}
        <section className="settings-card">
          <div className="card-title">
            <Lock size={18} />
            <h2>Change Password</h2>
          </div>

          <div className="form-group password-field">
            <label>Current Password</label>
            <div className="input-icon-wrap">
              <input type="password" placeholder="Enter current password" />
              <Eye size={16} />
            </div>
          </div>

          <div className="form-group password-field">
            <label>New Password</label>
            <div className="input-icon-wrap">
              <input type="password" placeholder="Enter new password" />
              <Eye size={16} />
            </div>
          </div>

          <div className="form-group password-field">
            <label>Confirm New Password</label>
            <div className="input-icon-wrap active-input">
              <input type="password" placeholder="Enter confirm new password" />
              <Eye size={16} />
            </div>
          </div>

          <div className="button-row">
            <button className="secondary-btn">Update Password</button>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="settings-card">
          <div className="card-title">
            <Bell size={18} />
            <h2>Notification Preferences</h2>
          </div>

          <div className="notification-list">
            <NotificationRow
              title="Email notifications"
              text="Receive alerts via email"
              active={notifications.email}
              onClick={() => toggleNotification('email')}
            />

            <NotificationRow
              title="Dashboard notifications"
              text="Show alerts on dashboard"
              active={notifications.dashboard}
              onClick={() => toggleNotification('dashboard')}
            />
          </div>
        </section>

        {/* Theme Settings */}
        <section className="settings-card">
          <div className="card-title">
            <Palette size={18} />
            <h2>Theme Settings</h2>
          </div>

          <label className="section-label">Choose Theme</label>

          <div className="theme-options">
            <ThemeOption
              icon={<Sun size={26} />}
              label="Light"
              selected={selectedTheme === 'light'}
              onClick={() => setSelectedTheme('light')}
            />

            <ThemeOption
              icon={<Moon size={26} />}
              label="Dark"
              selected={selectedTheme === 'dark'}
              onClick={() => setSelectedTheme('dark')}
            />

            <ThemeOption
              icon={<Monitor size={26} />}
              label="System"
              selected={selectedTheme === 'system'}
              onClick={() => setSelectedTheme('system')}
            />
          </div>
        </section>

        {/* Security Settings */}
        <section className="settings-card">
          <div className="card-title">
            <Shield size={18} />
            <h2>Security Settings</h2>
          </div>

          <div className="security-list">
            <SecurityRow
              icon={<Lock size={18} />}
              title="Two-Factor Authentication"
              text="Add an extra layer of security"
            />

            <SecurityRow
              icon={<LogOut size={18} />}
              title="Log out from All Devices"
              text="Sign out from all devices"
            />

            <SecurityRow
              icon={<Trash2 size={18} />}
              title="Delete Account"
              text="Permanently delete your account"
              danger
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const NotificationRow = ({ title, text, active, onClick }) => {
  return (
    <div className="notification-row">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <button
        className={`toggle-switch ${active ? 'active' : ''}`}
        onClick={onClick}
      >
        <span></span>
      </button>
    </div>
  );
};

const ThemeOption = ({ icon, label, selected, onClick }) => {
  return (
    <button
      className={`theme-option ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>

      <div className="radio-dot">
        {selected && <span></span>}
      </div>
    </button>
  );
};

const SecurityRow = ({ icon, title, text, danger }) => {
  return (
    <div className={`security-row ${danger ? 'danger' : ''}`}>
      <div className="security-icon">{icon}</div>

      <div className="security-text">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <ChevronRight size={18} />
    </div>
  );
};

export default UserProfileSettings;