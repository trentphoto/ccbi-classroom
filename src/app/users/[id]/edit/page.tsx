"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditUserPage() {
  const router = useRouter();
  // const params = useParams(); // Unused variable
  // const userId = params.id as string; // Unused variable

  useEffect(() => {
    // Redirect to dashboard where the user can open the dialog
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Please use the &quot;Edit&quot; button in the dashboard to edit users.</p>
      </div>
    </div>
  );
}
