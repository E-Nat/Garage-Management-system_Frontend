import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import { Wrench, LogOut, Bell, Send, CheckCircle2, Menu, X } from 'lucide-react';
import { UserProfileModal } from '../profile/UserProfileModal';
import { UserRole } from '../../types';
import logoImg from '../../assets/images/logo.png';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout, quickSwitchRole, activeTab, setActiveTab } = useAuth();
  const { systemSettings } = useGarage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const logoUrl = (systemSettings?.garageInfo?.logoUrl && !systemSettings.garageInfo.logoUrl.includes('unsplash.com'))
    ? systemSettings.garageInfo.logoUrl
    : logoImg;

  if (!currentUser) return null;

  return (
    <>
      <header className="bg-white border-b border-slate-100 text-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Hamburger (tablet & mobile) + Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Hamburger Button (visible on < 1200px) */}
            <button
              id="mobile-hamburger-btn"
              type="button"
              onClick={onToggleSidebar}
              className="min-[1200px]:hidden p-2 -ml-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="logo-fallback hidden w-8 h-8 rounded-lg bg-[#FF6B00] text-white items-center justify-center font-bold">
                  <Wrench className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
              <div className="truncate">
                <span className="font-bold text-sm text-slate-900 tracking-tight block leading-tight truncate">
                  APEX GARAGE
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Service Platform
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Quick Role Switcher (Desktop >= 1200px) */}
          <div className="hidden min-[1200px]:flex items-center gap-1 bg-slate-50/80 p-1 rounded-lg border border-slate-100">
            {(['admin', 'advisor', 'mechanic', 'parts_manager', 'customer'] as UserRole[]).map((roleKey) => {
              const isCurrent = currentUser.role === roleKey;
              return (
                <button
                  key={roleKey}
                  id={`quick-role-${roleKey}`}
                  onClick={() => quickSwitchRole(roleKey)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#FFF1E8] text-[#FF6B00] font-semibold shadow-xs border border-[#FF6B00]/30'
                      : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`}
                  title={`Switch role to ${roleKey.replace('_', ' ')}`}
                >
                  {roleKey === 'parts_manager' ? 'Parts' : roleKey}
                </button>
              );
            })}
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <button
              id="notifications-bell-btn"
              onClick={() => setActiveTab('settings')}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-100">
              <button
                id="user-profile-pill-btn"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#FF6B00] text-white font-semibold flex items-center justify-center text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-slate-900 leading-tight max-w-[100px] md:max-w-[140px] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                id="logout-btn"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast popup for Telegram Notification */}
      {showNotificationToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-3 max-w-md">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Telegram Bot Alert Sent
            </div>
            <div className="text-slate-400 mt-0.5">
              Automated status notification dispatched to <strong className="text-white">{currentUser.telegramHandle || '@alex_sterling'}</strong>.
            </div>
          </div>
        </div>
      )}

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

