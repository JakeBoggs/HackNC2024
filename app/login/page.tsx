import { LoginForm } from '@/components/auth/LoginForm';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Log in to TodoGPT</h2>
        <LoginForm />
      </div>
    </div>
  );
}