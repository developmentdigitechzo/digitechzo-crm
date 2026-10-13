import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loginBannerSuccess, setLoginBannerSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Forgot Password Modal State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'EMAIL' | 'VERIFY' | 'SUCCESS'>('EMAIL');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Strong password requirements validation
  const passwordChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
  };

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;
  const isStrongPassword = strengthScore === 5;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoginBannerSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err?.message || 'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseAdminCredentials = () => {
    setEmail('admin@digitechzo.com');
    setPassword('AdminSecurePassword123!');
    setError(null);
    setLoginBannerSuccess(null);
  };

  // Open Forgot Password Dialog
  const handleOpenForgotPassword = () => {
    setResetEmail(email.trim() || '');
    setResetOtp('');
    setSentCode(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetStep('EMAIL');
    setIsForgotPasswordOpen(true);
  };

  // Step 1: Send Verification Code to Email
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    setResetError(null);

    if (!cleanEmail) {
      setResetError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await authApi.sendPasswordResetCode(cleanEmail);
      setSentCode(res.code);
      setResetStep('VERIFY');
      setResendCooldown(45);
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Resend code trigger
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResetSubmitting) return;
    setResetError(null);
    setIsResetSubmitting(true);
    try {
      const res = await authApi.sendPasswordResetCode(resetEmail.trim().toLowerCase());
      setSentCode(res.code);
      setResendCooldown(45);
    } catch (err: any) {
      setResetError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Step 2: Confirm OTP Code and Set New Password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const cleanCode = resetOtp.trim();
    if (!cleanCode) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }

    if (!isStrongPassword) {
      setResetError('Your new password must meet all strong password requirements.');
      return;
    }

    if (!passwordsMatch) {
      setResetError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      await authApi.resetPasswordWithCode(resetEmail.trim().toLowerCase(), cleanCode, newPassword);
      setResetStep('SUCCESS');
    } catch (err: any) {
      setResetError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Step 3: Finish and populate login form
  const handleCompleteAndSignIn = () => {
    setEmail(resetEmail.trim());
    setPassword(newPassword);
    setIsForgotPasswordOpen(false);
    setError(null);
    setLoginBannerSuccess('Password reset successfully! We have prefilled your credentials. Click Sign In to continue.');
  };

  return (
    <>
      <Card className="shadow-lg border-[#2D3238] bg-white">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base font-bold text-[#1E242B]">Welcome back</CardTitle>
          <p className="text-xs text-[#556070]">Sign in to access your CRM workspace</p>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-btn bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#DC2626]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <div className="flex-1 font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {loginBannerSuccess && (
              <div className="p-3 rounded-btn bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1 font-medium leading-relaxed">{loginBannerSuccess}</div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="login-email" className="text-caption text-txt-secondary block">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@digitechzo.com"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-caption text-txt-secondary block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-[11px] text-[#57B71B] hover:text-[#469815] hover:underline font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 bg-[#57B71B] hover:bg-[#469815] text-white font-medium transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>

            {/* Quick Credential Helper for Functional Testing */}
            <div className="pt-3 border-t border-border">
              <div className="rounded-btn bg-slate-50 border border-border p-2.5 text-xs text-txt-secondary flex items-center justify-between">
                <div>
                  <p className="font-semibold text-txt-primary text-[11px]">Seeded Admin Account</p>
                  <p className="text-[10px] text-txt-muted font-mono">admin@digitechzo.com</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseAdminCredentials}
                  disabled={isSubmitting}
                  className="h-6 text-[10px] px-2 border-slate-300 hover:bg-slate-100"
                >
                  Autofill
                </Button>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Forgot Password & Email Verification Modal */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] p-5">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#57B71B] flex items-center justify-center shrink-0">
                <KeyRound className="h-4 w-4 text-[#57B71B]" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-[#1E242B]">
                  {resetStep === 'EMAIL' && 'Reset your password'}
                  {resetStep === 'VERIFY' && 'Email Verification & Reset'}
                  {resetStep === 'SUCCESS' && 'Password Reset Complete'}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-[#556070] mt-0.5">
                  {resetStep === 'EMAIL' && 'Enter your account email to receive a secure verification code.'}
                  {resetStep === 'VERIFY' && 'Enter the 6-digit code sent to your email and set a new password.'}
                  {resetStep === 'SUCCESS' && 'Your password has been securely updated. You can now log in.'}
                </DialogDescription>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 pt-3">
              <div
                className={`h-1 flex-1 rounded-full ${
                  resetStep === 'EMAIL' || resetStep === 'VERIFY' || resetStep === 'SUCCESS'
                    ? 'bg-[#57B71B]'
                    : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1 flex-1 rounded-full ${
                  resetStep === 'VERIFY' || resetStep === 'SUCCESS' ? 'bg-[#57B71B]' : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1 flex-1 rounded-full ${
                  resetStep === 'SUCCESS' ? 'bg-[#57B71B]' : 'bg-slate-200'
                }`}
              />
            </div>
          </DialogHeader>

          {resetError && (
            <div className="p-2.5 rounded-btn bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{resetError}</div>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {resetStep === 'EMAIL' && (
            <form onSubmit={handleSendVerificationCode} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1E242B] flex items-center justify-between">
                  <span>Registered Email Address <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. admin@digitechzo.com"
                    required
                    autoFocus
                    disabled={isResetSubmitting}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                <p className="text-[11px] text-[#556070] leading-relaxed">
                  We'll send a 6-digit verification code to this email to confirm account ownership.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  disabled={isResetSubmitting}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResetSubmitting || !resetEmail.trim()}
                  className="bg-[#57B71B] hover:bg-[#469815] text-white text-xs h-8 px-3"
                >
                  {isResetSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Verify Code and Set New Password */}
          {resetStep === 'VERIFY' && (
            <form onSubmit={handleConfirmReset} className="space-y-3.5 pt-1">
              {/* Notification Banner with Simulation Helper */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5 text-emerald-800">
                    <Mail className="h-3.5 w-3.5 text-[#57B71B]" />
                    Verification Code Sent
                  </span>
                  {sentCode && (
                    <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded shadow-xs">
                      Code: {sentCode}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Check inbox for <strong className="font-semibold text-emerald-900">{resetEmail}</strong>.
                </p>
                {sentCode && (
                  <button
                    type="button"
                    onClick={() => setResetOtp(sentCode)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#57B71B] hover:text-[#469815] underline cursor-pointer pt-0.5"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-fill verification code ({sentCode})
                  </button>
                )}
              </div>

              {/* 6-Digit OTP Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1E242B]">
                    6-Digit Verification Code <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isResetSubmitting}
                    className="text-[10px] text-[#57B71B] hover:underline disabled:text-txt-muted disabled:no-underline font-medium inline-flex items-center gap-1"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code (e.g. 123456)"
                  required
                  autoFocus
                  disabled={isResetSubmitting}
                  className="text-center font-mono text-sm tracking-widest font-semibold h-9"
                />
              </div>

              {/* New Strong Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1E242B] block">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong password"
                    required
                    disabled={isResetSubmitting}
                    className="pl-8 pr-8 text-xs h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-txt-secondary font-medium">Strength:</span>
                      <span
                        className={`font-semibold ${
                          strengthScore <= 2
                            ? 'text-red-600'
                            : strengthScore < 5
                            ? 'text-amber-600'
                            : 'text-[#57B71B]'
                        }`}
                      >
                        {strengthScore <= 2 ? 'Weak' : strengthScore < 5 ? 'Medium' : 'Strong'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`rounded-full h-full transition-all duration-200 ${
                            level <= strengthScore
                              ? strengthScore <= 2
                                ? 'bg-red-500'
                                : strengthScore < 5
                                ? 'bg-amber-500'
                                : 'bg-[#57B71B]'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
                      <span
                        className={`flex items-center gap-1 ${
                          passwordChecks.length ? 'text-[#57B71B] font-medium' : 'text-slate-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" /> 8+ Characters
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasUpper ? 'text-[#57B71B] font-medium' : 'text-slate-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" /> Capital letter (A-Z)
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasLower ? 'text-[#57B71B] font-medium' : 'text-slate-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" /> Lowercase letter (a-z)
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasNumber ? 'text-[#57B71B] font-medium' : 'text-slate-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" /> Number (0-9)
                      </span>
                      <span
                        className={`col-span-2 flex items-center gap-1 ${
                          passwordChecks.hasSpecial ? 'text-[#57B71B] font-medium' : 'text-slate-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" /> Special character (@, $, !, %, etc.)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1E242B] block">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={isResetSubmitting}
                    className="pl-8 pr-8 text-xs h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[10px] text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setResetStep('EMAIL')}
                  disabled={isResetSubmitting}
                  className="text-xs text-[#556070] hover:text-[#1E242B] underline"
                >
                  Change email
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    disabled={isResetSubmitting}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      isResetSubmitting ||
                      resetOtp.trim().length !== 6 ||
                      !isStrongPassword ||
                      !passwordsMatch
                    }
                    className="bg-[#57B71B] hover:bg-[#469815] text-white text-xs h-8 px-3"
                  >
                    {isResetSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {resetStep === 'SUCCESS' && (
            <div className="space-y-4 pt-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#57B71B] flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6 text-[#57B71B]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1E242B]">Password Reset Successfully!</h4>
                <p className="text-xs text-[#556070] max-w-xs mx-auto">
                  Your password has been securely updated. You can now log into Digitechzo CRM with your new password.
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <Button
                  type="button"
                  onClick={handleCompleteAndSignIn}
                  className="w-full bg-[#57B71B] hover:bg-[#469815] text-white text-xs h-9 font-medium"
                >
                  Back to Sign In <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
