import { AuthStagingLayout } from '@/components/auth/AuthStagingLayout';
import { SignupForm } from './SignupForm';

export default function SignupPage() {
  return (
    <AuthStagingLayout
      title="Start free trial"
      subtitle="Create your resort account — no charge until trial ends."
      titleSize="sm"
      wideCard
    >
      <SignupForm />
    </AuthStagingLayout>
  );
}
