'use client';

import { useState, useActionState } from 'react';
import { login } from './actions';
import { inter } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '../ui/button';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(login, null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <form action={loginAction} className="space-y-3">
          <div className="flex-1 rounded-lg bg-white px-6 pb-4 pt-8 shadow-lg">
            <h1 className={`${inter.className} mb-3 text-2xl font-bold text-center`}>
              Welcome Back
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Please log in to continue.
            </p>
            
            <div className="w-full space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-900"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    className="peer block w-full rounded-md border border-gray-200 py-3 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    required
                    disabled={loginPending}
                  />
                  <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-blue-500" />
                </div>
              </div>
              
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-900"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    className="peer block w-full rounded-md border border-gray-200 py-3 pl-10 pr-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    required
                    minLength={6}
                    disabled={loginPending}
                  />
                  <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-blue-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {loginState?.error && (
              <div className="flex items-center space-x-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600">{loginState.error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loginPending}
            >
              {loginPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  Log in
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Additional Options */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800 underline"
                disabled={loginPending}
              >
                Forgot your password?
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              New users can only be created by administrators.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
