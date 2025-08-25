"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewUserPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard where the user can open the dialog
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Please use the &quot;Add Student&quot; button in the dashboard to create new users.</p>
      </div>
    </div>
  );
}
