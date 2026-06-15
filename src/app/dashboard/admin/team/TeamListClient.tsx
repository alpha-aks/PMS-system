'use client';

import { useState, useTransition } from 'react';
import { UserData, UserRole, updateUserRole, updateUserAlias, updateUserMonthlySalary } from '@/app/actions/user';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/utils';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  initialUsers: UserData[];
}

const ALL_ROLES: UserRole[] = ['ADMIN', 'DEV', 'TECH', 'DESIGN', 'VIDEO', 'OPS'];

export default function TeamListClient({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } catch (error) {
        alert('Failed to update role. Please try again.');
      } finally {
        setUpdatingId(null);
      }
    });
  };

  const handleAliasChange = (userId: string, alias: string) => {
    setUpdatingId(userId);
    startTransition(async () => {
      try {
        await updateUserAlias(userId, alias || null);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, alias: alias || null } : u))
        );
      } catch (error) {
        alert('Failed to update alias.');
      } finally {
        setUpdatingId(null);
      }
    });
  };

  const handleSalaryChange = (userId: string, salaryStr: string) => {
    const salary = parseFloat(salaryStr) || 0;
    setUpdatingId(userId);
    startTransition(async () => {
      try {
        await updateUserMonthlySalary(userId, salary);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, monthlySalary: salary } : u))
        );
      } catch (error) {
        alert('Failed to update salary.');
      } finally {
        setUpdatingId(null);
      }
    });
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Agency Team Members</h2>
          <p className="text-sm text-text-muted">Manage roles and dashboard access</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'hsl(220 20% 16%)' }}>
              <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">User</th>
              <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">Alias</th>
              <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">Monthly Salary</th>
              <th className="pb-3 px-4 font-semibold text-text-secondary text-sm text-right">Role Assignment</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0" style={{ borderColor: 'hsl(220 20% 14%)' }}>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-text-secondary">
                  <input
                    type="text"
                    defaultValue={user.alias || ''}
                    placeholder="E.g. Om"
                    onBlur={(e) => handleAliasChange(user.id, e.target.value)}
                    disabled={isPending && updatingId === user.id}
                    className="bg-bg-dark border border-white/10 rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors w-28"
                  />
                </td>
                <td className="py-4 px-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <span className="text-text-muted">₹</span>
                    <input
                      type="number"
                      defaultValue={user.monthlySalary || 0}
                      onBlur={(e) => handleSalaryChange(user.id, e.target.value)}
                      disabled={isPending && updatingId === user.id}
                      className="bg-bg-dark border border-white/10 rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors w-24"
                    />
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="relative inline-block text-left group">
                    <button
                      disabled={isPending && updatingId === user.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: user.role ? `${ROLE_COLORS[user.role]}20` : 'hsl(220 20% 16%)',
                        color: user.role ? ROLE_COLORS[user.role] : 'hsl(220 10% 60%)',
                        border: `1px solid ${user.role ? `${ROLE_COLORS[user.role]}40` : 'hsl(220 20% 20%)'}`,
                      }}
                    >
                      {isPending && updatingId === user.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span>{user.role ? ROLE_LABELS[user.role] : 'Unassigned'}</span>
                      )}
                      <ChevronDown size={14} />
                    </button>

                    {/* Dropdown Menu (Hover based for simplicity, could be click-based) */}
                    <div className="absolute right-0 top-full mt-2 w-40 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden"
                         style={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 20%)' }}>
                      <div className="py-1">
                        {ALL_ROLES.map((roleOption) => (
                          <button
                            key={roleOption}
                            onClick={() => handleRoleChange(user.id, roleOption)}
                            className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-white/5"
                            style={{ color: ROLE_COLORS[roleOption] }}
                          >
                            {ROLE_LABELS[roleOption]}
                            {user.role === roleOption && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
