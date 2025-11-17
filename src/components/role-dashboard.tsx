"use client"

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { LogOut, User, DollarSign, Wheat, Heart, Warehouse, Users, Crown, Calculator } from "lucide-react"
import { useRouter } from 'next/navigation';
import { ProductionInputStaffDashboard } from "./WorkerDashboard/ProductionInputStaffDashboard";
import { ProductionPerformanceOverview } from "./WorkerDashboard/ProductionPerformanceOverview";

// Simple local CardHeader and CardTitle components
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b border-gray-100">{children}</div>
}
function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>
}

interface RoleDashboardProps {
  participant: {
    id: string
    name: string
    code: string
    access_tools: string[]
  } | null
  onSignOut: () => void
  buildings?: any[]; // Add these props
  farmPerformance?: any;
}

const roleConfigs = {
  worker: {
    title: "Worker Dashboard",
    color: "bg-blue-500",
    icon: Users,
    tools: ["Production Input", "Performance Dashboard"]
  },
  owner: {
    title: "Owner Dashboard", 
    color: "bg-green-500",
    icon: Crown,
    tools: ["Production Performance", "Owner Tools", "Production Input", "Harvest Input", "Harvest Output"]
  },
  cost: {
    title: "Cost Manager Dashboard",
    color: "bg-purple-500", 
    icon: Calculator,
    tools: ["Cost Management"]
  },
  feed: {
    title: "Feed Manager Dashboard",
    color: "bg-orange-500",
    icon: Wheat,
    tools: ["Nutrition Tracking"]
  }
} as const

type RoleKey = keyof typeof roleConfigs

export function RoleDashboard({ participant, onSignOut, buildings = [], farmPerformance = { totalMortality: 0, avgFCR: null, avgWeight: null } }: RoleDashboardProps) {
  if (!participant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Error</h1>
          <p>No participant data found</p>
          <Button onClick={onSignOut}>Back to Login</Button>
        </div>
      </div>
    );
  }

  // State for toggling view
  const [showOverview, setShowOverview] = useState(false);

  // Only show the Production Performance button if the worker has access
  const hasProductionPerformance = participant.access_tools.some(
    t => t.toLowerCase() === 'production performance' || t.toLowerCase() === 'performance dashboard'
  );

  // If worker, show WorkerDashboardCards
  if (participant.access_tools.includes('Production Input') || participant.access_tools.includes('Production Performance')) {
    // Add handler for viewing a building
    const handleInputBuilding = (id: string) => {
      console.log('Input building from RoleDashboard:', id);
      // TODO: Add navigation or modal logic here
    };
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header - unified style */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Worker Dashboard</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {participant.name}</p>
                  {participant.access_tools.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Access: {participant.access_tools.join(', ')}</p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={onSignOut}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
        {/* Production Input Staff Dashboard */}
        <ProductionInputStaffDashboard
          participant={participant}
          buildings={buildings}
          farmPerformance={farmPerformance}
          onSignOut={onSignOut}
        />
      </div>
    );
  }

  // Render a card for each access tool
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - unified style */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center`}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Worker Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {participant.name}</p>
                {participant.access_tools.length > 0 && (
                  <p className="text-xs text-gray-500">Access: {participant.access_tools.join(', ')}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onSignOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      {/* Render a card for each access tool */}
      <div className="flex gap-6 justify-center mt-10 mb-8 flex-wrap">
        {participant.access_tools.map((tool, idx) => (
          <div
            key={tool}
            className={`group cursor-pointer w-64`}
            tabIndex={0}
            role="button"
            // Optionally, add onClick logic for each tool here
          >
            <div className={`bg-white rounded-lg shadow-md border-2 transition-all flex flex-col h-full p-6 items-start group-hover:border-blue-600 group-focus:border-blue-600 border-blue-600`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{tool}</h3>
              </div>
              <p className="text-sm text-gray-600">Access granted</p>
            </div>
          </div>
        ))}
      </div>
      {/* Optionally, show the overview if needed */}
      {showOverview && (
        <div className="max-w-4xl mx-auto mt-10">
          <ProductionPerformanceOverview
            farmPerformance={{ totalMortality: 0, avgFCR: null, avgWeight: null }} // TODO: pass actual data
            buildings={[]} // TODO: pass actual buildings
          />
        </div>
      )}
    </div>
  );
}