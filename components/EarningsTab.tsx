import React from 'react';
import { Booking } from '../types';

interface EarningsTabProps {
  bookings: Booking[];
}

const EarningsTab: React.FC<EarningsTabProps> = ({ bookings }) => {
  // Filter for completed and paid bookings with accepted quotes
  const paidCompletedBookings = bookings.filter(b => 
    b.status === 'Completed' && b.quotationStatus === 'Accepted' && b.paymentDate && b.totalAmount
  );

  // Calculate total earnings
  const totalGrossEarnings = paidCompletedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Calculate total commission payable to V-Ken Serve
  const totalCommission = paidCompletedBookings.reduce((sum, b) => {
    if (b.totalAmount && b.totalAmount > 2500) {
      return sum + (0.10 * (b.totalAmount - 2500));
    }
    return sum;
  }, 0);

  const totalNetEarnings = totalGrossEarnings - totalCommission;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border space-y-6">
      <h3 className="text-xl font-semibold">Your Earnings Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Gross Earnings</p>
          <p className="text-2xl font-bold text-green-800">KES {totalGrossEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">V-Ken Serve Commission</p>
          <p className="text-2xl font-bold text-red-800">KES {totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">Net Earnings</p>
          <p className="text-2xl font-bold text-blue-800">KES {totalNetEarnings.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-3">Commission Details</h4>
        <p className="text-gray-600 text-sm mb-4">
          V-Ken Serve charges a commission on the total amount you charge the customer (the "Total Job Value") for completed jobs.
          For jobs with a Total Job Value of <span className="font-bold">KES 2,500 or less</span>, there is <span className="font-bold">no commission</span>.
          For jobs with a Total Job Value <span className="font-bold">greater than KES 2,500</span>, a commission of <span className="font-bold">10%</span> is applied <span className="italic">only</span> to the amount exceeding KES 2,500.
        </p>
        <p className="text-gray-600 text-sm">
          <span className="font-semibold">Example:</span> If a job's total value is KES 5,000, the commission payable to V-Ken Serve is 10% of (KES 5,000 - KES 2,500), which equals KES 250.
        </p>
      </div>

      <h4 className="text-lg font-semibold text-gray-700 mb-3">Detailed Transactions</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Booking ID</th>
              <th scope="col" className="px-6 py-3">Customer</th>
              <th scope="col" className="px-6 py-3">Service Date</th>
              <th scope="col" className="px-6 py-3 text-right">Job Value (KES)</th>
              <th scope="col" className="px-6 py-3 text-right">Commission (KES)</th>
              <th scope="col" className="px-6 py-3 text-right">Your Share (KES)</th>
            </tr>
          </thead>
          <tbody>
            {paidCompletedBookings.map(b => {
              const jobValue = b.totalAmount || 0;
              const commission = jobValue > 2500 ? 0.10 * (jobValue - 2500) : 0;
              const yourShare = jobValue - commission;
              return (
                <tr key={b.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{b.id.split('-')[1]}</td>
                  <td className="px-6 py-4">{b.customer.name}</td>
                  <td className="px-6 py-4">{new Date(b.serviceDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">{jobValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{commission.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-700">{yourShare.toLocaleString()}</td>
                </tr>
              );
            })}
             {paidCompletedBookings.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No completed and paid bookings with accepted quotes yet.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EarningsTab;