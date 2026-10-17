import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, ExternalLink, Info, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { NotificationItem } from '../../../types';

export const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationRead, 
    setActiveTab, 
    currentUser,
    openReworkBug,
    setSelectedBugId,
    setEmployeeSubTab
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    setIsOpen(false);

    const isMgr = currentUser?.role === 'manager' || currentUser?.role === 'admin';
    const isEmp = !isMgr && currentUser?.role !== 'client' && currentUser?.role !== 'hr';

    // Extract bug ID from link, title, or message
    const bugMatch = (notif.link || '').match(/bug-\d+/i) || 
                     (notif.title || '').match(/bug-\d+/i) || 
                     (notif.message || '').match(/bug-\d+/i);
    const bugId = bugMatch ? bugMatch[0] : null;

    const isReworkRelated = 
      (notif.link && notif.link.includes('rework')) ||
      (notif.title && /rework|defect|reopened|corrective|bug/i.test(notif.title)) ||
      (notif.message && /rework|defect|reopened|corrective|bug/i.test(notif.message));

    // Employee redirection
    if (isEmp) {
      if (isReworkRelated) {
        if (bugId) {
          openReworkBug(bugId);
        } else {
          setEmployeeSubTab('rework');
          setActiveTab('employee/dashboard');
        }
        return;
      }
      if (notif.link && notif.link.includes('payroll')) {
        setActiveTab('employee/payroll');
        return;
      }
      if (notif.link && notif.link.includes('status')) {
        setActiveTab('employee/status');
        return;
      }
      if (notif.link && notif.link.includes('modules')) {
        setActiveTab('employee/modules');
        return;
      }
    }

    // Manager redirection
    if (isMgr) {
      if (notif.link && (notif.link.includes('payroll') || notif.type === 'payroll_adjustment' || /dispute/i.test(notif.title))) {
        setActiveTab('manager/payroll');
        return;
      }
      if (notif.link && (notif.link.includes('reviews') || notif.type === 'review' || /review|classification|defect fix|submitted/i.test(notif.title))) {
        if (bugId) setSelectedBugId(bugId);
        setActiveTab('manager/reviews');
        return;
      }
      if (notif.link && notif.link.includes('modules')) {
        setActiveTab('modules');
        return;
      }
      if (bugId || (notif.link && notif.link.includes('bugs')) || isReworkRelated) {
        if (bugId) setSelectedBugId(bugId);
        setActiveTab('manager/reviews');
        return;
      }
    }

    // Default route navigation
    if (notif.link) {
      const cleanPath = notif.link.replace(/^\//, '');
      setActiveTab(cleanPath);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'assignment':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'review':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'payroll_adjustment':
        return <ShieldAlert className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-900">Notifications</h4>
              {unreadNotificationsCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  for (const n of notifications.filter(item => !item.read)) {
                    await markNotificationRead(n.id);
                  }
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-zinc-50 transition-colors cursor-pointer flex gap-3 items-start ${
                    !n.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-xs truncate ${!n.read ? 'font-bold text-zinc-950' : 'font-semibold text-zinc-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                        {formatTimestamp(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs">
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
