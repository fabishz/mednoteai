/**
 * src/components/onboarding/InviteUsersForm.tsx
 * 
 * Invite Users Form Component
 * Form to invite staff members to join the clinic
 */

import { useState, useEffect } from 'react';
import { onboardingService, type Invitation } from '@/services/onboarding';

interface InviteUsersFormProps {
  onSuccess?: () => void;
}

export function InviteUsersForm({ onSuccess }: InviteUsersFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoadingList(true);
      const data = await onboardingService.getInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setIsLoading(true);
      await onboardingService.inviteStaff({ email, role });
      setSuccess(true);
      setEmail('');
      await loadInvitations();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    try {
      await onboardingService.cancelInvitation(invitationId);
      await loadInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  const getRoleLabel = (r: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrator',
      DOCTOR: 'Doctor',
      NURSE: 'Nurse',
      STAFF: 'Staff',
    };
    return labels[r] || r;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Invite Team Members</h3>

      {/* Invite Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {success && (
          <p className="mt-2 text-sm text-green-600">Invitation sent successfully!</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>

      {/* Invitations List */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Pending Invitations ({invitations.length})
        </h4>

        {isLoadingList ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-gray-500">No pending invitations</p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{invitation.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{getRoleLabel(invitation.role)}</span>
                    <span className="text-gray-300">•</span>
                    {getStatusBadge(invitation.status)}
                  </div>
                </div>
                {invitation.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(invitation.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteUsersForm;
