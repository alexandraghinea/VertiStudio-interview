import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';

interface TransactionDashboardProps {
  transactions: Transaction[];
}

const TransactionDashboard: React.FC<TransactionDashboardProps> = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minValue: '',
    maxValue: '',
    buyerName: '',
    sellerName: '',
  });

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...transactions];

    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(filters.endDate));
    }
    if (filters.minValue) {
      filtered = filtered.filter(t => t.value >= Number(filters.minValue));
    }
    if (filters.maxValue) {
      filtered = filtered.filter(t => t.value <= Number(filters.maxValue));
    }
    if (filters.buyerName) {
      filtered = filtered.filter(t => 
        t.buyer_name.toLowerCase().includes(filters.buyerName.toLowerCase())
      );
    }
    if (filters.sellerName) {
      filtered = filtered.filter(t => 
        t.seller_name?.toLowerCase().includes(filters.sellerName.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [transactions, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Value</label>
          <input
            type="number"
            name="minValue"
            value={filters.minValue}
            onChange={handleFilterChange}
            placeholder="Min value"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Value</label>
          <input
            type="number"
            name="maxValue"
            value={filters.maxValue}
            onChange={handleFilterChange}
            placeholder="Max value"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Buyer Name</label>
          <input
            type="text"
            name="buyerName"
            value={filters.buyerName}
            onChange={handleFilterChange}
            placeholder="Search buyer"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Seller Name</label>
          <input
            type="text"
            name="sellerName"
            value={filters.sellerName}
            onChange={handleFilterChange}
            placeholder="Search seller"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Items per page selector */}
      <div className="flex justify-end">
        <select
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={15}>15 per page</option>
          <option value={30}>30 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bits</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(transaction.transaction_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.buyer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.seller_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${transaction.value.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.bit1}, {transaction.bit2}, {transaction.bit3}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>
        
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 rounded-md ${
                currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default TransactionDashboard; 