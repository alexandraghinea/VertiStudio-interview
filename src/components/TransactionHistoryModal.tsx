import React, { useState, useEffect } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

const ENDPOINT_URL = "http://localhost:3001/";

interface Transaction {
  id: string;
  bitslowId: string;
  previousOwner: string | null;
  newOwner: string;
  timestamp: string;
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bitslowId: string;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  bitslowId,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTransactionHistory();
    }
  }, [isOpen, bitslowId]);

  const fetchTransactionHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${ENDPOINT_URL}api/bitslows/${bitslowId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="medium" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No transaction history available</div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">
                      From: {transaction.previousOwner || 'Unclaimed'}
                    </p>
                    <p className="text-sm text-gray-600">
                      To: {transaction.newOwner}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryModal; 