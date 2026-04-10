import { Suspense } from 'react';
import { AuthStagingLayout } from '@/components/auth/AuthStagingLayout';
import { LoginForm } from './LoginForm';

function AuthLoading() {
  return (
    <div className="gw-auth-root">
      <div className="gw-auth-glow" aria-hidden />
      <div className="gw-login-card">
        <p style={{ margin: 0, color: 'var(--ink3)' }}>Loading…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthStagingLayout
        title="Sign in to your account"
        subtitle="Manage your resort's interactive site map."
      >
        <LoginForm />
      </AuthStagingLayout>
    </Suspense>
  );
}
