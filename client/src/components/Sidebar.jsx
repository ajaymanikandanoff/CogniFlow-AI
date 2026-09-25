import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Brain, LayoutDashboard, BookOpen, Sparkles,
  BarChart2, LogOut, Plus, Moon, Sun, Monitor,
  Menu, X, Settings, ChevronRight, Upload
} from 'lucide-react';

const NAV = [
  { name: "Today's Plan",  path: '/dashboard',    icon: LayoutDashboard },
  { name: 'Subjects',      path: '/subjects',      icon: BookOpen },
  { name: 'Analytics',     path: '/progress',      icon: BarChart2 },
  { name: 'Quiz',          path: '/quiz',           icon: Sparkles },
  { name: 'Upload PDF',    path: '/syllabus-upload',icon: Upload },
  { name: 'Settings',      path: '/settings',      icon: Settings },
];

const THEMES = [
  { key: 'dark',   label: 'Dark',   icon: Moon },
  { key: 'light',  label: 'Light',  icon: Sun },
  { key: 'system', label: 'System', icon: Monitor },
];

export default function Sidebar({ open, setOpen }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showThemes, setShowThemes] = useState(false);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--p)' }}>
              <Brain size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>CogniFlow</p>
              <p className="text-[10px] mono" style={{ color: 'var(--t3)' }}>Study AI</p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1.5 rounded-lg"
            style={{ color: 'var(--t3)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Add Subject shortcut */}
        <div className="px-3 pb-3">
          <Link
            to="/subjects"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full text-xs justify-start gap-2"
          >
            <Plus size={14} /> New Subject
          </Link>
        </div>

        <div className="divider mx-3" />

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {NAV.map(({ name, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={16} className="nav-icon" />
              {name}
            </Link>
          ))}
        </nav>

        <div className="divider mx-3" />

        {/* Theme switcher */}
        <div className="px-3 py-3">
          <button
            onClick={() => setShowThemes(v => !v)}
            className="nav-item w-full justify-between"
            style={{ width: '100%' }}
          >
            <span className="flex items-center gap-2.5">
              {theme === 'dark'   ? <Moon size={15} /> :
               theme === 'light'  ? <Sun size={15} /> :
               <Monitor size={15} />}
              <span className="text-[13px]">Theme</span>
            </span>
            <ChevronRight
              size={14}
              style={{
                transform: showThemes ? 'rotate(90deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
                color: 'var(--t3)'
              }}
            />
          </button>

          {showThemes && (
            <div className="mt-1 space-y-0.5 pl-2 anim-down">
              {THEMES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setShowThemes(false); }}
                  className="nav-item w-full text-xs"
                  style={{
                    background: theme === key ? 'var(--p-dim)' : undefined,
                    color: theme === key ? 'var(--p-text)' : undefined
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="divider mx-3" />
        <div className="px-3 py-3 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'var(--p)' }}
          >
            {user.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{user.name}</p>
            <p className="text-[10px] mono truncate" style={{ color: 'var(--t3)' }}>Student</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--t3)' }}
            title="Log out"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--bad)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
