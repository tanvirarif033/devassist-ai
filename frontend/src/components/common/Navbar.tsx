import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#12161F] border-b border-[#262C38] sticky top-0 z-50">
      <style>{FONT_IMPORT}</style>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-md border border-[#262C38] bg-[#0B0E14] flex items-center justify-center shrink-0">
              <span className="font-['JetBrains_Mono'] text-[#35D0B8] font-bold text-sm">
                {'>_'}
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] font-bold text-[#E7E9EE]">
              DevAssist<span className="text-[#35D0B8]">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {user?.fullName && (
              <div className="flex items-center gap-2.5">
                <span className="font-['Inter'] text-sm text-[#9AA3B2] hidden sm:inline">
                  {user.fullName}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#1A1F2B] border border-[#262C38] flex items-center justify-center font-['JetBrains_Mono'] text-xs text-[#35D0B8] font-semibold shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="w-px h-5 bg-[#262C38] hidden sm:block" />
            <button
              onClick={handleLogout}
              className="font-['JetBrains_Mono'] text-xs text-[#9AA3B2] hover:text-[#F2665E] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[#F2665E]/10"
            >
              logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;