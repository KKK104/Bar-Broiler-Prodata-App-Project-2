"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FarmSetup } from '@/components/calculator/farm-setup';
import { DailyTracking } from '@/components/calculator/daily-tracking';

const initialFarmData = {
  volumeDelivered: undefined,
  deadOnArrival: undefined,
  shortCount: undefined,
  reject: undefined,
  totalBegInv: undefined,
  initialGrams: undefined,
  building: undefined,
  drNo: '',
  docSource: '',
  feeds: '',
  batchStartDate: new Date().toISOString().split('T')[0],
  targetWeight: undefined,
  targetAge: undefined,
};

const initialDailyRecords = [
  {
    date: '2025-07-06',
    age: 1,
    dailyFeeds: 18,
    cumulativeFeeds: 18,
    feedsDelivery: 300,
    remainingFeeds: 282,
    dailyMortality: 47,
    cumulativeMortality: 47,
    mortalityPercent: 0.13,
    endingHeads: 36479,
    alw: 41,
    adg: 0.4,
    remarks: 'First day setup',
  },
  {
    date: '2025-07-07',
    age: 2,
    dailyFeeds: 16,
    cumulativeFeeds: 34,
    feedsDelivery: 0,
    remainingFeeds: 266,
    dailyMortality: 66,
    cumulativeMortality: 113,
    mortalityPercent: 0.31,
    endingHeads: 36413,
    alw: 42.5,
    adg: 1.5,
    remarks: 'Normal growth',
  },
];

export default function FarmSetupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'setup' | 'tracking'>('setup');
  const [farmData, setFarmData] = useState(initialFarmData);
  const [dailyRecords, setDailyRecords] = useState(initialDailyRecords);

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        className="mb-4 flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium"
        onClick={() => router.push('/')}
      >
        <span className="mr-2">&larr;</span> Back
      </button>
      {/* Tab Bar */}
      <div className="flex space-x-2 mb-6">
        <button
          className={`px-6 py-2 rounded-t-md font-medium text-sm focus:outline-none transition-colors ${activeTab === 'setup' ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'}`}
          onClick={() => setActiveTab('setup')}
        >
          Loading Detail Setup
        </button>
        <button
          className={`px-6 py-2 rounded-t-md font-medium text-sm focus:outline-none transition-colors ${activeTab === 'tracking' ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'}`}
          onClick={() => setActiveTab('tracking')}
        >
          Daily Tracking
        </button>
      </div>
      {/* Tab Content */}
      {activeTab === 'setup' && (
        <FarmSetup farmData={farmData} setFarmData={setFarmData} />
      )}
      {activeTab === 'tracking' && (
        <DailyTracking farmData={farmData} dailyRecords={dailyRecords} setDailyRecords={setDailyRecords} />
      )}
    </div>
  );
}
