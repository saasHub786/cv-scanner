import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FiMenu, FiX, FiLogOut, FiUser, FiGrid, FiFileText, FiSearch, FiClock, FiShield, FiLayers, FiStar } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const response = await api.getCreditBalance();
      if (response?.data?.success) setCredits(response.data.balance);
    } catch (e) {
      console.warn('Failed to load credits:', e.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { path: '/scan', label: 'Scan CV', icon: FiSearch },
    { path: '/bulk-scan', label: 'Bulk Scan', icon: FiLayers },
    { path: '/jobs', label: 'Jobs', icon: FiFileText },
    { path: '/history', label: 'History', icon: FiClock },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: FiShield }] : []),
  ];

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <nav className="glass-effect sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary-600 rounded-lg p-1.5">
              <FiSearch className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              CV<span className="text-primary-600">Scanner</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <link.icon className="text-base" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {/* Credits badge */}
            {credits !== null && (
              <Link to="/pricing" className="hidden md:flex items-center space-x-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition">
                <FiStar className="text-yellow-500" />
                <span>{credits} credits</span>
              </Link>
            )}

            {/* Profile */}
            <div className="hidden md:relative md:inline-block">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-1 flex items-center space-x-1">
                        <FiStar className="text-yellow-500 text-xs" />
                        <span className="text-xs font-medium text-yellow-700">{credits ?? '?'} credits</span>
                      </div>
                    </div>
                    <Link to="/pricing" onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiStar className="text-yellow-500" /><span>Buy Credits</span>
                    </Link>
                    <Link to="/dashboard" onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiGrid className="text-gray-400" /><span>Dashboard</span>
                    </Link>
                    <Link to="/history" onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <FiClock className="text-gray-400" /><span>History</span>
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                      <FiLogOut /><span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Link to="/pricing" className="flex items-center space-x-1 bg-yellow-50 px-2.5 py-1 rounded-full text-xs font-medium text-yellow-700">
              <FiStar className="text-yellow-500" />
              <span>{credits ?? '?'} credits</span>
            </Link>
          </div>
          <div className="py-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 text-sm ${
                  isActive(link.path) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <link.icon /><span>{link.label}</span>
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            <button onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full">
              <FiLogOut /><span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
