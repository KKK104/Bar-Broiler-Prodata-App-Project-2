"use client"
import { useRouter } from 'next/navigation';
import { PerformanceDashboard } from '@/components/calculator/performance-dashboard';

const mockFarmData = {
  volumeDelivered: 36720,
  deadOnArrival: 56,
  shortCount: 0,
  reject: 138,
  totalBegInv: 36526,
  initialGrams: 40.6,
  building: 1,
  drNo: '67734/67733',
  docSource: 'SUSTAMINA',
  feeds: 'PHILMICO',
  batchStartDate: new Date().toISOString().split('T')[0],
  targetWeight: 0,
  targetAge: 0,
};

const mockDailyRecords = [
  {
    date: '2025-07-06',
    age: 1,
    dailyFeeds: 18,
    cumulativeFeeds: 18,
    feedsDelivery: 18,
    remainingFeeds: 0,
    dailyMortality: 47,
    cumulativeMortality: 47,
    mortalityPercent: 0.3,
    endingHeads: 36479,
    alw: 41,
    adg: 0.4,
    remarks: '',
  },
  // Add more records as needed for demo
];

export default function PerformanceDashboardPage() {
  const router = useRouter();
  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        className="mb-4 flex items-center text-sm text-gray-700 hover:text-black font-medium"
        onClick={() => router.push('/')}
      >
        <span className="mr-2">&larr;</span> Back
      </button>
      <PerformanceDashboard farmData={mockFarmData} dailyRecords={mockDailyRecords} />
    </div>
  );
}
