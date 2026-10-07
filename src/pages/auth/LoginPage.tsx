import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('arjun.v@digitechzo.com');
  const [password, setPassword] = useState('password123');
  const { login, allMockUsers } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email);
    navigate('/dashboard');
  };

  const handleQuickSelect = (userEmail: string) => {
    setEmail(userEmail);
    login(userEmail);
    navigate('/dashboard');
  };

  return (
    <Card className="shadow-lg border-[#2D3238] bg-white">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-bold text-[#1E242B]">Welcome back</CardTitle>
        <p className="text-xs text-[#556070]">Sign in to access your sales workspace</p>
      </CardHeader>
      
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-3.5">
          <div className="space-y-1">
            <label htmlFor="login-email" className="text-caption text-txt-secondary block">
              Email address
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@digitechzo.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-caption text-txt-secondary block">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                className="text-[11px] text-[#57B71B] hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full mt-1 bg-[#57B71B] hover:bg-[#469815] text-white">
            Sign In <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

          {/* Quick Mock Role Selector */}
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#57B71B]" /> Quick Switch Role (Mock Auth)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {allMockUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u.email)}
                  className="p-1.5 rounded-btn border border-border bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-left text-xs transition-colors cursor-pointer"
                  aria-label={`Login as ${u.firstName} (${u.role})`}
                >
                  <span className="font-semibold text-txt-primary block truncate">{u.firstName}</span>
                  <span className="text-[10px] text-txt-muted block truncate">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};
