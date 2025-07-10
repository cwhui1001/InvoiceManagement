'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Basic validation
  if (!data.email || !data.password) {
    return {
      error: 'Please fill in all fields',
    }
  }

  if (!data.email.includes('@')) {
    return {
      error: 'Please enter a valid email address',
    }
  }

  if (data.password.length < 6) {
    return {
      error: 'Password must be at least 6 characters long',
    }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Supabase auth error:', error)
    // Handle specific Supabase auth errors
    if (error.message.includes('Invalid login credentials')) {
      return {
        error: 'Invalid email or password',
      }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        error: 'Please check your email and confirm your account',
      }
    }
    if (error.message.includes('Email address not confirmed')) {
      return {
        error: 'Please check your email and confirm your account',
      }
    }
    return {
      error: error.message || 'Login failed. Please try again.',
    }
  }

  // If we get here, login was successful
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}