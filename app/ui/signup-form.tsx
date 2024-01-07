'use client'

import { useState } from 'react';
import {
  AtSymbolIcon,
  KeyIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/app/ui/button';
import { useFormStatus } from 'react-dom';
import { signUp } from '@/app/lib/actions'; 

type UserStateType = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    username?: string[];
  };
  message: string | null;
};

export default function SignUpForm() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [, setUserState] = useState<UserStateType>({ errors: {}, message: null });
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleSubmit = async (event: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) => {
    event.preventDefault();
    const { email, password, confirmPassword } = formData;

    // Reset confirm password error
    setConfirmPasswordError('');

    // Check if passwords match
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return; // Stop the form submission if passwords don't match
    }

    const form = new FormData();
    form.append('name', formData.name);
    form.append('email', email);
    form.append('password', password);
    const response = await signUp(form);
    setUserState(response);

    if (response.message === 'User created and signed in successfully') {
      window.location.href = '/dashboard';
    }
  };

  // Function to handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Form content and fields */}
      <NameField value={formData.name} onChange={handleInputChange} />
      <EmailField value={formData.email} onChange={handleInputChange} />
      <PasswordField value={formData.password} onChange={handleInputChange} />
      <ConfirmPasswordField value={formData.confirmPassword} onChange={handleInputChange} />
      
      {/* Submit Button */}
      <Button type="submit" className="mt-4 w-full">
        Sign Up <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
      </Button>

       {/* Confirm Password Error Message */}
      {confirmPasswordError && (
        <div className="text-red-500">{confirmPasswordError}</div>
      )}
    </form>
  );
}

function NameField({ value, onChange }: { value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {

  return (
    <div>
      <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="name">
        Name
      </label>
      <div className="relative">
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
          id="name"
          type="name"
          name="name"
          placeholder="Enter your name"
          value={value}
          onChange={onChange}
          required
        />
        <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
      </div>
    </div>
  );
}

function EmailField({ value, onChange }: { value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {

  return (
    <div>
      <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="email">
        Email
      </label>
      <div className="relative">
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
          id="email"
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={value}
          onChange={onChange}
          required
        />
        <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
      </div>
    </div>
  );
}

function PasswordField({ value, onChange }: { value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="mt-4">
      <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="password">
        Password
      </label>
      <div className="relative">
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
          id="password"
          type="password"
          name="password"
          placeholder="Enter password"
          value={value}
          onChange={onChange}
          required
          minLength={6}
        />
        <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
      </div>
    </div>
  );
}

function ConfirmPasswordField({ value, onChange }: { value: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="mt-4">
      <label className="mb-3 mt-5 block text-xs font-medium text-gray-900" htmlFor="confirmPassword">
        Confirm Password
      </label>
      <div className="relative">
        <input
          className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
          id="confirm-password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={value}
          onChange={onChange}
          required
          minLength={6}
        />
        <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
      </div>
    </div>
  );
}

function SignUpButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-4 w-full" aria-disabled={pending}>
      Sign Up <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
    </Button>
  );
}
