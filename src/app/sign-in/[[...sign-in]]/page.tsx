import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div
        className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'hsl(234 89% 74%)' }}
      />
      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'shadow-none',
              card: 'bg-surface-card border border-border-subtle shadow-card rounded-2xl',
              headerTitle: 'text-text-primary font-display',
              headerSubtitle: 'text-text-muted',
              formFieldInput: 'bg-surface-elevated border-border-default text-text-primary rounded-lg',
              formButtonPrimary: 'btn-primary',
              footerActionLink: 'text-brand-primary',
              socialButtonsBlockButton: 'border-border-default bg-surface-elevated text-text-secondary rounded-lg hover:bg-surface-overlay',
            },
          }}
        />
      </div>
    </div>
  );
}
