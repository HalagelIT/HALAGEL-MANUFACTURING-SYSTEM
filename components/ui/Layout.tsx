
import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { Category, ProductionEntry } from '../../types';
import { CATEGORIES } from '../../constants';
import { LoginModal } from '../modals/LoginModal';
import { InputModal } from '../modals/InputModal';
import { UserModal } from '../modals/UserModal';
import { OffDayModal } from '../modals/OffDayModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { StorageService } from '../../services/storageService';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, Plus, LogOut, Database,
  CalendarX, LayoutDashboard, RefreshCw, LogIn, CheckCircle, Info, Bell,
  ClipboardList, Users, History, Key, Settings
} from 'lucide-react';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const { category, setCategory, isDarkMode, toggleDarkMode, triggerRefresh } = useDashboard();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showOffDays, setShowOffDays] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ProductionEntry | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const timeoutRef = useRef<number | null>(null);

  const handleNotify = useCallback((e: any) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setNotification({ message: e.detail.message, type: e.detail.type || 'success' });
    timeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      timeoutRef.current = null;
    }, 5000);
  }, []);

  const handleEditEntry = useCallback((e: any) => {
    setEntryToEdit(e.detail);
    setShowInput(true);
  }, []);

  const handleLogout = () => {
    const userName = user?.name || 'User';
    logout();
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message: `LOGOUT SUCCESSFUL: GOODBYE ${userName.toUpperCase()}`, type: 'success' } 
    }));
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    window.addEventListener('app-notification', handleNotify);
    window.addEventListener('edit-production-entry', handleEditEntry);
    return () => {
      window.removeEventListener('app-notification', handleNotify);
      window.removeEventListener('edit-production-entry', handleEditEntry);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [handleNotify, handleEditEntry]);

  const handleSync = async () => {
    if (!GoogleSheetsService.isEnabled()) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'DB ERROR: PLEASE CONFIGURE GOOGLE SHEETS IN USER MGMT', type: 'info' } 
      }));
      return;
    }
    setIsSyncing(true);
    try {
      await StorageService.syncWithSheets();
      triggerRefresh();
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'CLOUD DATA SYNCHRONIZED', type: 'success' } 
      }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'SYNC FAILED - CHECK CONNECTION', type: 'info' } 
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  const navItemClass = (path: string) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
    ${location.pathname === path 
      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800' 
      : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}
  `;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans`}>
      {/* GLOBAL SYSTEM MESSAGE BANNER */}
      {notification && (
        <div className="fixed top-8 right-8 z-[10000] pointer-events-none">
          <div className="notification-animate pointer-events-auto">
            <div className={`flex items-center gap-5 px-8 py-5 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.35)] border-2 bg-white dark:bg-slate-800 ${
              notification.type === 'success' ? 'border-emerald-500' : 'border-indigo-500'
            }`}>
              <div className={`p-3 rounded-2xl shadow-inner ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-7 h-7" /> : <Info className="w-7 h-7" />}
              </div>
              <div className="min-w-[220px]">
                <p className={`text-[11px] font-black uppercase tracking-[0.3em] leading-none mb-1.5 flex items-center gap-1.5 ${
                  notification.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'
                }`}>
                  <Bell className="w-3 h-3" /> System Message
                </p>
                <p className="text-base font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-850 border-r border-gray-200 dark:border-slate-700 z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col items-center justify-center border-b border-gray-100 dark:border-slate-800">
           {/* LOGO SECTION */}
           <div className="w-48 mb-2">
             <img 
               src="data:image/png;base64,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" 
               alt="Halagel Logo" 
               className="w-full h-auto object-contain"
             />
             <div className="text-center">
          <h1 className="font-extrabold text-2xl tracking-tight">HALA<span className="text-green-600">GEL</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Manufacturing System</p>
           </div>
        </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/')}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/reports')}>
            <ClipboardList className="w-4 h-4" /> Production Reports
          </Link>

          <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</div>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat as Category); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                category === cat ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}>
              {cat}
            </button>
          ))}

          {user && (
            <>
              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</div>
              <button onClick={() => { setShowInput(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                <Plus className="w-4 h-4 text-emerald-500" /> New Entry
              </button>
              
              {hasPermission(['admin', 'manager']) && (
                <button onClick={() => { setShowOffDays(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                  <CalendarX className="w-4 h-4 text-rose-500" /> Public Holidays
                </button>
              )}

              {hasPermission(['admin']) && (
                <Link to="/users" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/users')}>
                  <Users className="w-4 h-4" /> User Management
                </Link>
              )}

              <Link to="/logs" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/logs')}>
                <History className="w-4 h-4" /> Activity Logs
              </Link>

              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</div>
              <button onClick={() => { setShowChangePass(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                <Key className="w-4 h-4 text-indigo-500" /> Change Password
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-black text-lg hidden md:block text-slate-700 dark:text-white capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</h2>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                GoogleSheetsService.isEnabled() ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Database className="w-3 h-3" />
                {GoogleSheetsService.isEnabled() ? 'DB Connected' : 'Local Only'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSync} disabled={isSyncing} className={`p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${isSyncing ? 'animate-spin text-indigo-500' : ''}`}>
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={toggleDarkMode} className="p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase">{user.name.charAt(0)}</div>
                 <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-black uppercase text-indigo-500 leading-none">{user.role}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-white">{user.name}</p>
                 </div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
                <LogIn className="w-4 h-4" />Login
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showInput && <InputModal onClose={() => { setShowInput(false); setEntryToEdit(null); }} editEntry={entryToEdit} />}
      {showOffDays && <OffDayModal onClose={() => setShowOffDays(false)} />}
      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </div>
  );
};
