import { TrendingUp, FileText, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Payroll Approvals | AI CEO',
};

export default function PayrollApprovalsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(43 96% 56% / 0.15)', color: 'hsl(43 96% 56%)' }}
            >
              <TrendingUp size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Payroll Approvals</h1>
          </div>
          <p className="text-text-secondary text-sm">
            AI-proposed payouts requiring Master Admin sign-off.
          </p>
        </div>
      </div>

      <div className="glass-panel p-16 text-center">
        <FileText size={48} className="mx-auto mb-4 text-text-muted" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Batch Payroll System Pending</h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Phase 2 will introduce the AI Payroll Engine. Once the AI calculates the EOD completions, payouts will appear here in a batch list for your final global approval.
        </p>
      </div>
    </div>
  );
}
