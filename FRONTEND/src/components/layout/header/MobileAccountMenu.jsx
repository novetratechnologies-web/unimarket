// MobileAccountMenu.jsx
import React, { useEffect, useRef } from 'react';
import { User, LogOut, UserCircle, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MobileAccountMenu = ({ isOpen, onClose, user, onLogout, accountMenuItems }) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add animation classes
      if (backdropRef.current) {
        backdropRef.current.classList.add('animate-fade-in');
      }
      if (menuRef.current) {
        menuRef.current.classList.add('animate-slide-up');
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the menu
    if (e.target === backdropRef.current) {
      console.log('📱 Backdrop clicked - closing menu');
      onClose();
    }
  };

  const handleItemClick = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📱 Menu item clicked:', path);
    
    // Close menu first
    onClose();
    
    // Navigate after menu is closed (allow animation to complete)
    setTimeout(() => {
      console.log('📱 Navigating to:', path);
      navigate(path);
    }, 250);
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📱 Logout clicked');
    
    onClose();
    
    setTimeout(() => {
      onLogout();
    }, 250);
  };

  const handleMenuClick = (e) => {
    // Stop clicks inside menu from reaching backdrop
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      {/* Backdrop with modern blur effect */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-[99999]"
        style={{ 
          opacity: 1,
          pointerEvents: 'auto'
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Sliding panel with spring animation */}
      <div
        ref={menuRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[100000] transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          transform: 'translateY(0)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={handleMenuClick}
      >
        {/* Drag handle for better UX */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header with glass morphism effect */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="relative transform transition-transform duration-300 hover:scale-105">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-500 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-xl">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user?.firstName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xl text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="truncate max-w-[150px]">{user?.email}</span>
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110 active:scale-95 flex-shrink-0 group"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
          
          {/* University Badge with shimmer effect */}
          <div className="px-6 pb-4">
            <div className="relative overflow-hidden rounded-full">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border border-teal-200 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <UserCircle className="w-4 h-4 mr-2" />
                <span className="truncate max-w-[200px]">{user?.university || 'University Student'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content with smooth scrolling */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-2"
          style={{ 
            maxHeight: 'calc(90vh - 240px)',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="space-y-6">
            {accountMenuItems.map((section, sectionIdx) => (
              <div 
                key={sectionIdx} 
                className="space-y-2 animate-fade-in-up"
                style={{ animationDelay: `${sectionIdx * 50}ms` }}
              >
                <div className="px-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-teal-500 rounded-full"></span>
                    {section.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={(e) => handleItemClick(e, item.path)}
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 active:bg-gray-100 transition-all duration-300 group relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all duration-300"></div>
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600 group-hover:bg-white group-hover:text-teal-600 group-hover:scale-110 transition-all duration-300 group-hover:shadow-md">
                        {item.icon}
                      </div>
                      <span className="relative font-medium text-gray-800 text-base flex-1 text-left group-hover:text-teal-700 group-hover:translate-x-1 transition-all duration-300">
                        {item.label}
                      </span>
                      <ChevronRight className="relative w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-2 transition-all duration-300" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
        </div>

        {/* Footer with modern logout button */}
        <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t border-gray-200 p-6">
          <button
            onClick={(e) => handleLogoutClick(e)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 hover:from-red-100 hover:to-rose-100 rounded-xl font-semibold transition-all duration-300 border-2 border-red-200 hover:border-red-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-rose-500/0 group-hover:from-red-500/10 group-hover:to-rose-500/10 transition-all duration-300"></div>
            <LogOut className="w-5 h-5 relative group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Add keyframe animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MobileAccountMenu;