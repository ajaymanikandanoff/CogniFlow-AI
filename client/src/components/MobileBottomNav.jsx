import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart2,
  Settings
} from 'lucide-react';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { name: 'Plan',     path: '/dashboard', icon: LayoutDashboard },
    { name: 'Subjects', path: '/subjects',  icon: BookOpen },
    { name: 'Quiz',     path: '/quiz',      icon: Sparkles },
    { name: 'Stats',    path: '/progress',  icon: BarChart2 },
    { name: 'Settings', path: '/settings',  icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-2 py-1 shadow-2xl transition-colors duration-200"
      style={{
        background: 'rgba(16, 16, 24, 0.92)',
        borderColor: 'var(--line)'
      }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div
                className="p-1 rounded-lg transition-all"
                style={{
                  background: isActive ? 'var(--p-dim)' : 'transparent',
                  color: isActive ? 'var(--p-text)' : 'var(--t2)'
                }}
              >
                <Icon size={18} />
              </div>
              <span
                className="text-[10px] font-medium tracking-tight mt-0.5"
                style={{ color: isActive ? 'var(--t1)' : 'var(--t3)' }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
