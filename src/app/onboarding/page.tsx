import { UserButton } from '@clerk/nextjs';
import { Bot } from 'lucide-react';
import AdminBackdoor from './AdminBackdoor';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>

      <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, hsl(234 89% 74%), hsl(271 91% 65%))' }}
        >
          <Bot size={32} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary font-display">Welcome to BrandBoosters!</h1>
        
        <p className="text-text-secondary leading-relaxed">
          Your account has been created successfully. The Master Admin is currently reviewing your profile to assign your specific dashboard role (Video Editor, Designer, Tech, etc.).
        </p>

        <div className="p-4 rounded-xl" style={{ background: 'hsl(43 96% 56% / 0.1)', border: '1px solid hsl(43 96% 56% / 0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: 'hsl(43 96% 56%)' }}>Status: Awaiting Role Assignment</p>
          <p className="text-xs text-text-muted mt-1">Please check back later or contact the admin.</p>
        </div>

        <AdminBackdoor />
      </div>
    </div>
  );
}
