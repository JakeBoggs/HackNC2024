import { SignUpForm } from '@/components/auth/SignUpForm';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create your account</h2>
        <SignUpForm />
      </div>
    </div>
  );
}