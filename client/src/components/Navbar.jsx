import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Brain, LayoutDashboard, BookOpen, Sparkles, Bot,
  Bell, LogOut, Plus, TrendingUp, Sun, Moon, Settings, X
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => { if (user) loadNotifications(); }, [user, location.pathname]);

  const loadNotifications = async () => {
    try {
      const data = await api.getDashboard();
      if (data?.notifications) setNotifications(data.notifications);
    } catch { /* quiet */ }
  };

  const links = [
    { name: "Today", path: '/dashboard', icon: LayoutDashboard },
    { name: 'Subjects', path: '/subjects', icon: BookOpen },
    { name: 'Analytics', path: '/progress', icon: TrendingUp },
    { name: 'Quiz', path: '/quiz', icon: Sparkles },
    { name: 'AI Coach', path: '/ai-coach', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 surface-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 gap-4">

        {/* Brand */}
        <Link
          to={user ? '/dashboard' : '/'}
          id="nav-brand"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-400 transition-colors">
            <Brain size={15} className="text-white" />
          </div>
          <span className="font-display font-semibold text-sm txt-1 hidden sm:block">CogniFlow</span>
          <span className="tag tag-muted hidden sm:inline-flex text-[10px] py-[1px]">Study AI</span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {links.map(({ name, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              >
                <Icon size={14} />
                {name}
              </Link>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleTheme} className="btn btn-ghost p-2 rounded-lg" title="Toggle theme">
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>

          {user ? (
            <>
              <Link to="/subjects" id="nav-add" className="btn btn-primary text-xs px-3 py-2">
                <Plus size={13} />
                <span className="hidden sm:inline">Add Subject</span>
              </Link>

              {/* Bell */}
              <div className="relative">
                <button
                  id="nav-bell"
                  onClick={() => setShowNotif(v => !v)}
                  className="btn btn-ghost p-2 rounded-lg relative"
                >
                  <Bell size={15} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
                {showNotif && (
                  <div className="absolute right-0 top-full mt-2 w-80 popover p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold txt-1">Notifications</span>
                      <button onClick={() => setShowNotif(false)} className="btn btn-ghost p-1 rounded">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs txt-3 py-3 text-center">Nothing new</p>
                      ) : notifications.map((n, i) => (
                        <div key={i} className="surface-raised rounded-lg p-3 space-y-0.5">
                          <p className="text-xs font-semibold txt-1">{n.title}</p>
                          <p className="text-xs txt-2">{n.message}</p>
                        </div>
                      ))}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={async () => { try { await api.clearNotifications(); setNotifications([]); } catch {} }}
                        className="mt-3 w-full text-xs txt-3 hover:text-rose-400 transition py-1"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* User */}
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[var(--border)] ml-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-[11px] font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <span className="text-xs font-medium txt-1 hidden lg:block">{user.name}</span>
                <button
                  onClick={logout}
                  className="btn btn-ghost p-2 rounded-lg hover:text-rose-400 transition-colors"
                  title="Log out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost text-xs px-3 py-2">Log in</Link>
              <Link to="/signup" className="btn btn-primary text-xs px-3 py-2">Get started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav strip */}
      {user && (
        <div className="lg:hidden flex items-center gap-0.5 overflow-x-auto no-scrollbar px-4 pb-2 border-t border-[var(--border)] pt-1.5">
          {links.map(({ name, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link text-[11px] whitespace-nowrap py-1 px-2.5 ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={12} />
              {name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
