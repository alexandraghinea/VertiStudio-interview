import React, { useState } from 'react';
import TransactionHistoryModal from './TransactionHistoryModal';

interface BitSlow {
  id: string;
  hash: string;
  componentNumbers: number[];
  monetaryValue: number;
  currentOwner: string | null;
}

interface BitSlowCardProps {
  bitslow: BitSlow;
  onBuy: () => void;
}

const BitSlowCard: React.FC<BitSlowCardProps> = ({ bitslow, onBuy }) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">BitSlow #{bitslow.id}</h3>
            <p className="text-sm text-gray-500">Hash: {bitslow.hash}</p>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            View History
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Components:</span>
            <div className="flex space-x-1">
              {bitslow.componentNumbers.map((num, index) => (
                <span
                  key={index}
                  className="bg-gray-100 px-2 py-1 rounded text-sm"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Value:</span>
            <span className="font-semibold">${bitslow.monetaryValue.toFixed(2)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Owner:</span>
            <span className="font-medium">
              {bitslow.currentOwner || 'Unclaimed'}
            </span>
          </div>
        </div>

        {!bitslow.currentOwner && (
          <button
            onClick={onBuy}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Buy Now
          </button>
        )}
      </div>

      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        bitslowId={bitslow.id}
      />
    </div>
  );
};

export default BitSlowCard; 