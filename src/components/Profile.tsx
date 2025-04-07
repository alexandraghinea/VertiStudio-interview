import React, { useState, useEffect } from 'react';
import TransactionDashboard from './TransactionDashboard';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface ProfileData {
  totalTransactions: number;
  totalBitSlows: number;
  totalValue: number;
  holdings: {
    coin_id: number;
    bit1: number;
    bit2: number;
    bit3: number;
    value: number;
    computedBitSlow: string;
  }[];
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`http://localhost:3001/api/profile/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Your Dashboard</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transaction Summary</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Total Transactions:</span>{' '}
              {profileData?.totalTransactions || 0}
            </p>
            <p>
              <span className="font-medium">BitSlows Owned:</span>{' '}
              {profileData?.totalBitSlows || 0}
            </p>
            <p>
              <span className="font-medium">Total Value:</span>{' '}
              ${profileData?.totalValue.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* BitSlow Holdings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your BitSlows</h2>
          <div className="space-y-4">
            {profileData?.holdings.map((holding) => (
              <div key={holding.coin_id} className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium text-sm text-gray-600">BitSlow #{holding.coin_id}</p>
                <p className="text-xs text-gray-500 break-all">{holding.computedBitSlow}</p>
                <p className="mt-1 text-sm">Value: ${holding.value.toLocaleString()}</p>
              </div>
            ))}
            {(!profileData?.holdings || profileData.holdings.length === 0) && (
              <p className="text-gray-500">No BitSlows owned yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 