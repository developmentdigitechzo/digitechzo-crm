import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#16181B] p-4 select-none">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-card bg-white p-2 flex items-center justify-center shadow-md">
            <img
              src="/assets/images/logo.png"
              alt="DigiTechzo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">DigiTechzo CRM</h1>
            <p className="text-xs text-slate-400">Sales & Operations Platform</p>
          </div>
        </div>
        
        <Outlet />

        <p className="text-center text-[11px] text-slate-500">
          DigiTechzo Internal Operations &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
