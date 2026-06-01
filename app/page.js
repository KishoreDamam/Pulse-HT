'use client';

import { useState, useEffect } from 'react';

export default function HabitTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Auth Form State
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Mobile Responsiveness Tab & Drawer states
  const [activeTab, setActiveTab] = useState('wheel'); // 'habits' | 'wheel' | 'stats'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check auth state and register Service Worker on mount
  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registration successful:', reg.scope))
        .catch(err => console.warn('Service Worker registration failed:', err));
    }

    // 2. Authentication Check
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
          
          // Store backend habit data to LocalStorage temporarily for the engine to pick up
          if (data.data) {
            localStorage.setItem('cht_habits', JSON.stringify(data.data.habits || []));
            localStorage.setItem('cht_logs', JSON.stringify(data.data.logs || {}));
            localStorage.setItem('cht_quote', data.data.quote || 'Discipline equals freedom.');
          }
          
          loadTrackerEngine();
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error verifying auth state:', err);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  // Dynamically load the client-side habit engine
  const loadTrackerEngine = () => {
    // Avoid double script appending
    if (document.getElementById('cht-engine-script')) {
      // If script already exists, trigger reload
      if (window.chtReloadAndRender) {
        window.chtReloadAndRender();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'cht-engine-script';
    script.src = '/habit-tracker-engine.js';
    script.defer = true;
    script.onload = () => {
      console.log('Habit tracker engine script successfully loaded.');
    };
    document.body.appendChild(script);
  };

  // Trigger click events on background native action elements
  const triggerBackupClick = () => {
    document.getElementById('backup-btn')?.click();
  };
  
  const triggerPrintBlankClick = () => {
    document.getElementById('print-blank-btn')?.click();
  };
  
  const triggerPrintFilledClick = () => {
    document.getElementById('print-filled-btn')?.click();
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        
        // Sync API returns and trigger engine reload
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.authenticated && meData.data) {
          localStorage.setItem('cht_habits', JSON.stringify(meData.data.habits || []));
          localStorage.setItem('cht_logs', JSON.stringify(meData.data.logs || {}));
          localStorage.setItem('cht_quote', meData.data.quote || 'Discipline equals freedom.');
        }

        loadTrackerEngine();
      } else {
        setErrorMsg(data.error || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setErrorMsg('A network connection error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        
        // Load engine on new account
        loadTrackerEngine();
      } else {
        setErrorMsg(data.error || 'Signup failed. Email might already be taken.');
      }
    } catch (err) {
      console.error('Signup submission error:', err);
      setErrorMsg('A network connection error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUser(null);
      // Clean temporary storage so another user doesn't see caching overlap
      localStorage.removeItem('cht_habits');
      localStorage.removeItem('cht_logs');
      localStorage.removeItem('cht_quote');
      
      // Force page refresh to cleanly reset SVGs and engine handlers
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="splash-spinner"></div>
        <div className="splash-text">Loading circular habit engine...</div>
      </div>
    );
  }

  return (
    <>
      {/* Background Ambient Glowing Orbs */}
      <div className="bg-glow-container" aria-hidden="true">
        <div className="bg-glow-orb orb-1"></div>
        <div className="bg-glow-orb orb-2"></div>
        <div className="bg-glow-orb orb-3"></div>
      </div>

      {/* Sleek Authentication Overlay */}
      {!isAuthenticated && (
        <div className="auth-overlay">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo-icon">C</div>
              <h2 className="auth-title">Circular Habit Tracker</h2>
              <p className="auth-subtitle">
                {isLoginView ? 'Design your perfect month' : 'Start your discipline journey'}
              </p>
            </div>

            {errorMsg && (
              <div className="auth-error-panel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {errorMsg}
              </div>
            )}

            {isLoginView ? (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="email-input">EMAIL ADDRESS</label>
                  <div className="auth-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input 
                      className="auth-input" 
                      id="email-input"
                      type="email" 
                      placeholder="name@domain.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="password-input">PASSWORD</label>
                  <div className="auth-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input 
                      className="auth-input" 
                      id="password-input"
                      type="password" 
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-options">
                  <label className="auth-checkbox-label" htmlFor="remember-me">
                    <input 
                      type="checkbox" 
                      id="remember-me"
                      className="auth-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Always logged in
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn auth-btn-submit"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Verifying Account...' : 'Access Dashboard'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignupSubmit}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="register-email">CREATE ACCOUNT EMAIL</label>
                  <div className="auth-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input 
                      className="auth-input" 
                      id="register-email"
                      type="email" 
                      placeholder="name@domain.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="register-password">CHOOSE A PASSKEY</label>
                  <div className="auth-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input 
                      className="auth-input" 
                      id="register-password"
                      type="password" 
                      placeholder="At least 6 characters"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn auth-btn-submit"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Provisioning Profile...' : 'Sign Up & Start'}
                </button>
              </form>
            )}

            <div className="auth-footer">
              {isLoginView ? (
                <>
                  Need to start fresh? 
                  <span className="auth-switch-link" onClick={() => { setIsLoginView(false); setErrorMsg(''); }}>
                    Register Account
                  </span>
                </>
              ) : (
                <>
                  Already have an account? 
                  <span className="auth-switch-link" onClick={() => { setIsLoginView(true); setErrorMsg(''); }}>
                    Access Dashboard
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Circular Habit Tracker Dashboard Container */}
      <div style={{ display: isAuthenticated ? 'contents' : 'none' }}>
        <header>
          <div className="logo-section">
            <div className="logo-icon">C</div>
            <div>
              <h1>Circular Habit Tracker</h1>
            </div>
          </div>
          
          <div className="wheel-controls">
            <button className="control-btn" id="prev-month-btn" title="Previous Month" aria-label="Previous Month">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="current-month-display" id="month-display">---</div>
            <button className="control-btn" id="next-month-btn" title="Next Month" aria-label="Next Month">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <div className="header-actions">
            {/* User Credentials display & signout widget */}
            {user && (
              <div className="user-profile-widget">
                <span className="user-email-display" title={user.email}>{user.email}</span>
                <button className="btn-signout" onClick={handleSignOut}>Sign Out</button>
              </div>
            )}

            {/* Theme Toggle */}
            <button className="btn btn-secondary btn-icon" id="theme-toggle" title="Toggle Theme" aria-label="Toggle Theme">
              <svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'none' }}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              <svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>

            {/* Backup Utilities */}
            <button className="btn btn-secondary" id="backup-btn" title="Import/Export Backup">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Backup
            </button>

            {/* Print Actions */}
            <button className="btn btn-secondary" id="print-blank-btn" title="Print a Blank Paper Tracker template">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Print Blank
            </button>
            <button className="btn btn-primary" id="print-filled-btn" title="Print pre-filled monthly logs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Print Filled
            </button>

            {/* Mobile Actions Menu Trigger Button */}
            <button 
              className="btn btn-secondary btn-icon btn-mobile-menu" 
              title="Menu"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ display: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <main>
          {/* Left Sidebar: Habit Management (Legend) */}
          <section className={`left-sidebar glass-card ${activeTab === 'habits' ? 'tab-active' : ''}`} id="habit-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Habits Legend
              </h2>
              <button className="btn btn-secondary btn-sm" id="add-habit-btn" title="Add a new habit (Max 10)">+ Add</button>
            </div>
            <div className="panel-content">
              <div className="habit-list" id="habit-list-container">
                {/* Dynamic Habits injected by engine */}
              </div>
            </div>
          </section>

          {/* Center Workspace: Interactive SVG Wheel */}
          <section className={`center-canvas ${activeTab === 'wheel' ? 'tab-active' : ''}`}>
            <div className="wheel-container">
              <svg className="habit-wheel" id="habit-wheel-svg" viewBox="-300 -300 600 600">
                {/* Concentric circles and wedges drawn dynamically */}
              </svg>
              
              <div className="wheel-center-content" id="wheel-center">
                <div className="wheel-center-month" id="wheel-center-month-label">MAY</div>
                <div className="wheel-center-stats" id="wheel-center-percentage">0%</div>
                <div className="wheel-center-label">Done Today</div>
                <div className="wheel-center-print-line"></div>
                <div className="wheel-center-year" id="wheel-center-year-label">2026</div>
              </div>
            </div>

            {/* Metric Color Guide */}
            <div className="metric-guide glass-card">
              <div className="metric-guide-item"><span className="metric-dot done-dot"></span>Done</div>
              <div className="metric-guide-item"><span className="metric-dot partial-dot"></span>Partial</div>
              <div className="metric-guide-item"><span className="metric-dot not-done-dot"></span>Not Done</div>
              <div className="metric-guide-item"><span className="metric-dot exempt-dot"></span>Exempt</div>
              <div className="metric-guide-item info-tip">Click wedges to cycle status</div>
            </div>
          </section>

          {/* Right Sidebar: Analytics & Quotes */}
          <section className={`right-sidebar ${activeTab === 'stats' ? 'tab-active' : ''}`}>
            <div className="glass-card">
              <div className="panel-header">
                <h2 className="panel-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                  Monthly Progress
                </h2>
              </div>
              <div className="panel-content">
                <div className="stat-grid">
                  <div className="stat-card" style={{ borderLeft: '4px solid #51cf66' }}>
                    <span className="stat-value" id="stats-done-count" style={{ color: '#51cf66' }}>0</span>
                    <span className="stat-label">Done</span>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #ffd43b' }}>
                    <span className="stat-value" id="stats-partial-count" style={{ color: '#ffd43b' }}>0</span>
                    <span className="stat-label">Partial</span>
                  </div>
                </div>
                <div className="stat-grid">
                  <div className="stat-card" style={{ borderLeft: '4px solid #ff6b6b' }}>
                    <span className="stat-value" id="stats-not-done-count" style={{ color: '#ff6b6b' }}>0</span>
                    <span className="stat-label">Not Done</span>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '4px solid #adb5bd' }}>
                    <span className="stat-value" id="stats-exempt-count" style={{ color: '#adb5bd' }}>0</span>
                    <span className="stat-label">Exempt</span>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                <div className="stat-grid">
                  <div className="stat-card">
                    <span className="stat-value" id="stats-best-streak">0d</span>
                    <span className="stat-label">Best Streak</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value" id="stats-completion-rate">0%</span>
                    <span className="stat-label">Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Settings Card */}
            <div className="glass-card quote-section" style={{ padding: '2.2rem 1.5rem' }}>
              <div className="quote-text" id="quote-display">Discipline equals freedom.</div>
            </div>
          </section>
        </main>

        {/* Printable Quote Block */}
        <div className="print-quote" id="print-quote-block">"Discipline equals freedom."</div>

        {/* Mobile Tab Navigation Bar */}
        <nav className="mobile-tab-bar">
          <button 
            className={`tab-item ${activeTab === 'habits' ? 'active' : ''}`} 
            onClick={() => setActiveTab('habits')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span>Habits</span>
          </button>
          
          <button 
            className={`tab-item ${activeTab === 'wheel' ? 'active' : ''}`} 
            onClick={() => setActiveTab('wheel')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.9 2.9-1.1-1.1 4-4"/><circle cx="12" cy="12" r="6"/></svg>
            <span>Wheel</span>
          </button>
          
          <button 
            className={`tab-item ${activeTab === 'stats' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stats')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            <span>Analytics</span>
          </button>
        </nav>

        {/* Mobile menu bottom action drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="mobile-menu-card glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <h3>Quick Actions</h3>
                <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>&times;</button>
              </div>
              <div className="mobile-menu-body">
                <button className="btn btn-secondary" onClick={() => { setIsMobileMenuOpen(false); triggerBackupClick(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  Backup & Restore Logs
                </button>
                <button className="btn btn-secondary" onClick={() => { setIsMobileMenuOpen(false); triggerPrintBlankClick(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Print Blank Template
                </button>
                <button className="btn btn-primary" onClick={() => { setIsMobileMenuOpen(false); triggerPrintFilledClick(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><rect width="12" height="8" x="6" y="14"/></svg>
                  Print Pre-Filled Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Modal */}
        <div className="modal-backdrop" id="backup-modal">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3 className="modal-title">Backup & Restore Logs</h3>
              <button className="modal-close" id="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Copy this text to save your data elsewhere, or paste your saved data text here to restore it.
              </p>
              <textarea id="backup-text" readOnly onClick={(e) => e.target.select()}></textarea>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" id="copy-backup-btn">Copy to Clipboard</button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                <input type="text" id="import-input" placeholder="Paste data here and press Import..." style={{ fontSize: '0.8rem' }} />
                <button className="btn btn-primary btn-sm" id="import-btn">Import Data</button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating context menu for tactile logging */}
        <div id="wedge-context-menu" className="glass-card floating-context-menu" style={{ display: 'none' }}>
          <button className="context-btn-item btn-done" data-status="done" title="Done">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button className="context-btn-item btn-partial" data-status="partial" title="Partial">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </button>
          <button className="context-btn-item btn-not-done" data-status="not-done" title="Not Done">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
          <button className="context-btn-item btn-exempt" data-status="exempt" title="Exempt">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/></svg>
          </button>
          <div className="context-divider"></div>
          <button className="context-btn-item btn-clear" data-status="clear" title="Clear State">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>

        {/* Color Picker Grid Popup */}
        <div className="color-picker-grid" id="picker-popup">
          {/* Filled by JS */}
        </div>
      </div>
    </>
  );
}
