import React, { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';

const apiClient = new ApiClient();
const router = useRouter();

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.currentTarget);
    const result = await apiClient.signup(
      formData.get('email') as string,
      formData.get('password') as string,
      formData.get('displayName') as string
    );
    
    console.log('Signup success:', result);
    router.push('/login');
  } catch (error) {
    console.error('Signup failed:', error);
    // Show error to user
  }
} 