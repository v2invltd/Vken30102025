import React from 'react';
import { Booking } from '../types';
import { InfoIcon } from './IconComponents';

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
    <div className="bg-white p-6 rounded-lg shadow-md border space-y-8">
      {/* New Cost Overview Card */}
      <div className="border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-gray-200">
          {/* Column 1: Total Cost */}
          <div className="py-2 md:pr-6">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <span>Current Period (total gross)</span>
              <InfoIcon className="w-4 h-4 ml-1 text-gray-400" />
            </div>
            <p className="text-3xl font-light text-gray-900">
              KES {totalGrossEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              includes KES {totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })} in platform fees
            </p>
          </div>
          
          {/* Column 2: Net Earnings Comparison */}
          <div className="py-2 md:pl-6">
             <div className="flex items-center text-sm text-gray-600 mb-2">
                <span>—</span>
                <InfoIcon className="w-4 h-4 ml-1 text-gray-400" />
            </div>
             <p className="text-3xl font-light text-gray-900">
                KES {totalNetEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
             <p className="text-sm text-gray-500 mt-1">
                net earnings this period
             </p>
          </div>

          {/* Column 3: Forecast */}
          <div className="py-2 md:pl-6">
             <div className="flex items-center text-sm text-gray-600 mb-2">
                <span>Forecasted total cost</span>
                 <InfoIcon className="w-4 h-4 ml-1 text-gray-400" />
            </div>
             <p className="text-md text-gray-600 mt-5">
                Not enough historical data to project cost
             </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-3">Commission Details</h4>
        <p className="text-gray-600 text-sm mb-4">
          V-Ken Serve charges a commission on the total amount you charge the customer (the "Total Job Value") for completed jobs.
          For jobs with a Total Job Value of <span className="font-bold">KES 2,500 or less</span>, there is <span className="font-bold">no commission</span>.
          For jobs with a Total Job Value <span className="font-bold">greater than KES 2,500</span>, a commission of <span className="font-bold">10%</span> is applied <span className="italic">only</span> to the amount exceeding KES 2,500.
        </p>
      </div>

      <h4 className="text-lg font-semibold text-gray-700 mb-3">Detailed Transactions</h4>
      <div className="overflow-x-auto border rounded-lg">
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
                  <td className="px-6 py-4 font-medium text-gray-900">{b.id.substring(0,8)}...</td>
                  <td className="px-6 py-4">{b.customer.name}</td>
                  <td className="px-6 py-4">{new Date(b.serviceDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">{jobValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-red-600">{commission.toLocaleString()}</td>
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