// MobileAccountMenu.jsx
import React, { useEffect, useRef } from 'react';
import { User, LogOut, UserCircle, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MobileAccountMenu = ({ isOpen, onClose, user, onLogout, accountMenuItems }) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const backdropRef = useRef(null);
  
  // Log when component renders
  console.log('🎯 MobileAccountMenu render - isOpen:', isOpen);
  console.log('🎯 MobileAccountMenu props - user:', user?.firstName);
  console.log('🎯 MobileAccountMenu items count:', accountMenuItems?.length);

  useEffect(() => {
    console.log('🎯 MobileAccountMenu useEffect - isOpen changed to:', isOpen);
    console.log('🎯 Menu ref exists:', !!menuRef.current);
    console.log('🎯 Backdrop ref exists:', !!backdropRef.current);
    
    if (isOpen) {
      console.log('🎯 Opening menu - locking body scroll');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('🎯 Closing menu - restoring body scroll');
      document.body.style.overflow = 'unset';
    }

    return () => {
      console.log('🎯 MobileAccountMenu cleanup - isOpen was:', isOpen);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    console.log('🎯 Backdrop clicked - target:', e.target);
    console.log('🎯 Backdrop ref current:', backdropRef.current);
    console.log('🎯 Is target equal to backdrop?', e.target === backdropRef.current);
    console.log('🎯 Event type:', e.type);
    console.log('🎯 Event phase:', e.eventPhase);
    
    if (e.target === backdropRef.current) {
      console.log('🎯 Closing menu from backdrop click');
      onClose();
    } else {
      console.log('🎯 Backdrop click ignored - target is not backdrop');
    }
  };

  const handleItemClick = (e, path) => {
    console.log('🎯 Menu item clicked - path:', path);
    console.log('🎯 Event target:', e.target);
    console.log('🎯 Event currentTarget:', e.currentTarget);
    console.log('🎯 Stopping propagation');
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Closing menu and navigating to:', path);
    onClose();
    console.log('🎯 Navigation scheduled for:', path);
    setTimeout(() => {
      console.log('🎯 Executing navigation to:', path);
      navigate(path);
    }, 100);
  };

  const handleLogoutClick = (e) => {
    console.log('🎯 Logout button clicked');
    console.log('🎯 Event target:', e.target);
    console.log('🎯 Event currentTarget:', e.currentTarget);
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Closing menu and logging out');
    onClose();
    console.log('🎯 Logout scheduled');
    setTimeout(() => {
      console.log('🎯 Executing logout');
      onLogout();
    }, 100);
  };

  const handleCloseClick = (e) => {
    console.log('🎯 Close button clicked');
    console.log('🎯 Event target:', e.target);
    
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Closing menu from close button');
    onClose();
  };

  const handleMenuClick = (e) => {
    console.log('🎯 Menu container clicked - target:', e.target);
    console.log('🎯 Menu container clicked - currentTarget:', e.currentTarget);
    console.log('🎯 Stopping propagation');
    e.stopPropagation();
  };

  if (!isOpen) {
    console.log('🎯 Menu not open - returning null');
    return null;
  }

  console.log('🎯 Rendering menu - menu is open');
  console.log('🎯 Menu items to render:', accountMenuItems?.length);

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999]"
        onClick={handleBackdropClick}
      />
      
      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[100000] max-h-[90vh] flex flex-col"
        onClick={handleMenuClick}
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
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
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
              <div>
                <p className="font-bold text-xl text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleCloseClick}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* University Badge */}
          <div className="px-6 pb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border border-teal-200">
              <UserCircle className="w-4 h-4 mr-2" />
              <span>{user?.university || 'University Student'}</span>
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {accountMenuItems.map((section, sectionIdx) => (
            <div key={sectionIdx} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={(e) => handleItemClick(e, item.path)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-800 flex-1 text-left">
                      {item.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="flex-shrink-0 border-t border-gray-200 p-6">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 hover:from-red-100 hover:to-rose-100 rounded-xl font-semibold border-2 border-red-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAccountMenu;