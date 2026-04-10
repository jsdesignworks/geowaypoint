import { AuthStagingLayout } from '@/components/auth/AuthStagingLayout';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthStagingLayout title="Forgot password" titleSize="sm">
      <ForgotPasswordForm />
    </AuthStagingLayout>
  );
}
