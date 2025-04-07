import React, { useState, useEffect } from 'react';
import { useNotifications } from './ui/NotificationSystem';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import BitSlowCard from './BitSlowCard';
import GenerateCoinModal from './GenerateCoinModal';

interface BitSlow {
  id: string;
  hash: string;
  componentNumbers: number[];
  monetaryValue: number;
  currentOwner: string | null;
}

const ITEMS_PER_PAGE = 30;
const ENDPOINT_URL = "http://localhost:3001/";

const BitSlowMarketplace: React.FC = () => {
  const [bitslows, setBitslows] = useState<BitSlow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  
  const { showLoading, hideLoading, showError, showSuccess } = useNotifications();

  const fetchBitslows = async (page: number) => {
    showLoading('Loading BitSlows...');
    try {
      const response = await fetch(`${ENDPOINT_URL}api/bitslows?page=${page}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) {
        throw new Error('Failed to fetch BitSlows');
      }
      const data = await response.json();
      setBitslows(data.bitslows);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch BitSlows';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      hideLoading();
    }
  };

  useEffect(() => {
    fetchBitslows(currentPage);
  }, [currentPage]);

  const handleBuy = async (bitslowId: string) => {
    showLoading('Processing purchase...');
    try {
      const response = await fetch(`${ENDPOINT_URL}api/bitslows/${bitslowId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to purchase BitSlow');
      }

      showSuccess('Successfully purchased BitSlow!');
      fetchBitslows(currentPage); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase BitSlow';
      showError(errorMessage);
    } finally {
      hideLoading();
    }
  };

  const handleGenerateCoin = async (amount: number) => {
    showLoading('Generating new BitSlow...');
    try {
      const response = await fetch(`${ENDPOINT_URL}api/bitslows/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate BitSlow');
      }

      showSuccess('Successfully generated new BitSlow!');
      setIsGenerateModalOpen(false);
      fetchBitslows(currentPage); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate BitSlow';
      showError(errorMessage);
    } finally {
      hideLoading();
    }
  };

  if (isLoading && bitslows.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">BitSlow Marketplace</h1>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Generate Coin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bitslows.map((bitslow) => (
          <BitSlowCard
            key={bitslow.id}
            bitslow={bitslow}
            onBuy={() => handleBuy(bitslow.id)}
          />
        ))}
      </div>

      {bitslows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No BitSlows available. Generate a new one!
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <GenerateCoinModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerateCoin}
      />
    </div>
  );
};

export default BitSlowMarketplace; 