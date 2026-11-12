import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  BookOpen,
  ShieldAlert,
  Activity,
  Users,
  Settings,
  Menu,
  X,
  Type,
  Globe,
  UserCheck,
  LayoutDashboard,
  Edit3,
  Plus
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from './EditProfileModal';
import { AppLanguage, FontSize, UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { language, setLanguage, fontSize, setFontSize, t } = usePreferences();
  const { user, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'edit' | 'create'>('edit');

  const navItems = [
    { id: 'home', label: t('navHome'), icon: Heart },
    { id: 'chat', label: t('navChat'), icon: MessageSquare, badge: 'AI' },
    { id: 'lessons', label: t('navLessons'), icon: BookOpen },
    { id: 'safety', label: t('navSafety'), icon: ShieldAlert, highlight: true },
    { id: 'wellness', label: t('navWellness'), icon: Activity },
    { id: 'caregiver', label: t('navCaregiver'), icon: Users },
    { id: 'admin', label: t('navAdmin'), icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleFontSizeCycle = () => {
    const nextSize: Record<FontSize, FontSize> = {
      normal: 'large',
      large: 'xlarge',
      xlarge: 'normal'
    };
    setFontSize(nextSize[fontSize]);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Heart className="w-7 h-7 fill-white/20 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
                Buddy
                <span className="text-emerald-400 font-semibold text-lg">Elder AI</span>
              </div>
              <div className="text-xs text-stone-400 hidden sm:block">
                {t('tagline')}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-base font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : item.highlight
                      ? 'text-amber-300 hover:bg-stone-800 hover:text-amber-200'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-amber-400' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-emerald-800 text-emerald-200 text-xs px-1.5 py-0.5 rounded font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Accessibility & Role Controls */}
          <div className="flex items-center gap-2">
            {/* Font Size Adjuster Button */}
            <button
              onClick={handleFontSizeCycle}
              aria-label="Adjust font size"
              title={`Current font: ${fontSize}. Tap to enlarge.`}
              className="flex items-center gap-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Type className="w-4 h-4 text-emerald-400" />
              <span className="uppercase text-xs font-bold">{fontSize}</span>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as AppLanguage)}
                aria-label="Select language"
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold py-2 pl-3 pr-8 rounded-lg border border-stone-700 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
              <Globe className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 text-xs font-bold text-stone-300 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span className="hidden md:inline">{user?.role || 'ROLE'}</span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-stone-800 border border-stone-700 rounded-xl shadow-xl p-2 z-50">
                  {/* Current Active User Name Info */}
                  <div className="px-3 py-2 bg-stone-900/60 rounded-lg mb-2 border border-stone-700/60">
                    <div className="text-xs text-stone-400 font-semibold">Active User</div>
                    <div className="text-sm font-extrabold text-white truncate">{user?.name}</div>
                    <div className="text-xs text-emerald-400 font-mono">{user?.role}</div>
                  </div>

                  {/* Direct Change User Name Button */}
                  <button
                    onClick={() => {
                      setProfileModalMode('edit');
                      setIsProfileModalOpen(true);
                      setRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-emerald-300 hover:bg-stone-700 flex items-center gap-2 transition-colors cursor-pointer mb-1"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <span>Change User Name</span>
                  </button>

                  {/* Add New Profile Button */}
                  <button
                    onClick={() => {
                      setProfileModalMode('create');
                      setIsProfileModalOpen(true);
                      setRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-teal-300 hover:bg-stone-700 flex items-center gap-2 transition-colors cursor-pointer mb-2"
                  >
                    <Plus className="w-4 h-4 text-teal-400" />
                    <span>Add New Profile</span>
                  </button>

                  <div className="border-t border-stone-700 my-1 pt-1.5">
                    <div className="text-xs text-stone-400 px-3 py-1 font-semibold uppercase tracking-wider">
                      {t('switchRole')}
                    </div>
                    {(['ELDER', 'CAREGIVER', 'ADMIN'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          user?.role === r ? 'bg-emerald-700 text-white' : 'text-stone-200 hover:bg-stone-700'
                        }`}
                      >
                        <span>
                          {r === 'ELDER' ? '👵 Elder' : r === 'CAREGIVER' ? '👨‍👩‍👧 Caregiver' : '🛡️ Admin'}
                        </span>
                        {user?.role === r && <span className="text-xs bg-emerald-800 px-1.5 py-0.5 rounded">Active</span>}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-stone-700 my-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-stone-700 font-semibold cursor-pointer"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 border-t border-stone-800 px-4 pt-3 pb-6 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : item.highlight
                    ? 'text-amber-300 bg-amber-950/30'
                    : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-emerald-800 text-emerald-200 text-xs px-2 py-0.5 rounded font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {/* Edit Profile / Change Name Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        defaultMode={profileModalMode}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
