"use client"

import { useState, useMemo } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Copy, Check, User, Home, Calculator, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { supabase } from "@/lib/supabase"; // adjust path as needed
import { useRouter } from 'next/navigation';
import PerformanceBenchmark from "./PerformanceBenchmark";
import CostInput from "./calculator/cost-input";
import { HarvestInputComponent } from './harvest/harvest-input';
import { HarvestOutputComponent } from './harvest/harvest-output';
import { MortalityChart } from './charts/MortalityChart';
import { FCRChart } from './charts/FCRChart';
import { WeightChart } from './charts/WeightChart';
import { ADGChart } from './charts/ADGChart';
import { BuildingAwarePerformanceDashboard } from './BuildingAwarePerformanceDashboard';
import { FeedbackButton } from './feedback/feedback-button';
import { NavigationHeader } from './ui/navigation-header';

  // Helper function (move above the Dashboard component)
  function getAdgChartDataForBuilding(buildingId: string) {
  // Dummy data for now; replace with real data as needed
  // Example: [{ day: 1, standard: 60, actual: 58 }, ...]
  const data = [];
  for (let day = 0; day <= 35; day++) {
    const standard = day === 0 ? 0 : 60 + (day * 0.3); // Gradual increase in standard, starts from 0
    const actual = day === 0 ? 0 : standard - 2 + (Math.sin(day * 0.2) * 1); // Slight variation around standard
    data.push({ 
      day, 
      standard: Math.round(standard), 
      actual: Math.round(actual) 
    });
  }
  return data;
}

interface DashboardProps {
  participants: any[]
  buildings: any[]
  onAddParticipant: () => void
  onEditParticipant?: (id: number) => void
  onDeleteParticipant?: (id: number) => void
  onAddBuilding: () => void
  onEditBuilding?: (id: string) => void
  onDeleteBuilding?: (id: string) => void
  onViewBuilding?: (id: string) => void
  onSignOut: () => void
  onBackToLanding: () => void
  userEmail?: string
  farmId?: string
  farmPerformance?: {
    totalMortality: number
    avgFCR: number | null
    avgWeight: number | null
  }
  onBenchmarkChange?: (preset: string) => void;
  isWorkerView?: boolean // <-- add this
}

export function Dashboard(props: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "buildings" | "benchmark" | "cost-input" | "harvest-input" | "harvest-output">("overview")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [buildingSortBy, setBuildingSortBy] = useState<"name" | "cycle" | "date" | "status">("name")
  const [buildingSortOrder, setBuildingSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null)
  const [selectedBenchmark, setSelectedBenchmark] = useState("Ross");
  const [showProductionInputList, setShowProductionInputList] = useState(false);
  const [adgModalBuilding, setAdgModalBuilding] = useState<string | null>(null);
  const [showGraphs, setShowGraphs] = useState<{ [id: string]: boolean }>({});
  // Remove the global showGraphs state
  // Instead, use a local state for each building card

  const router = useRouter();

  const handleSignOut = () => {
    console.log('Dashboard sign out button clicked')
    props.onSignOut()
  }

  const handleBenchmarkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBenchmark(e.target.value);
    if (props.onBenchmarkChange) {
      props.onBenchmarkChange(e.target.value);
    }
  };

  // Get unique cycle numbers for filtering
  const uniqueCycles = useMemo(() => {
    const cycles = props.buildings
      .map(b => b.cycle_number)
      .filter((cycle, index, arr) => cycle && arr.indexOf(cycle) === index)
      .sort((a, b) => (a || 0) - (b || 0))
    return cycles
  }, [props.buildings])

  // Sort and filter buildings based on current settings
  const sortedBuildings = useMemo(() => {
    // First filter by selected cycle
    let filtered = props.buildings
    if (selectedCycle !== null) {
      filtered = props.buildings.filter(b => b.cycle_number === selectedCycle)
    }

    // Then sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (buildingSortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || ""
          bValue = b.name?.toLowerCase() || ""
          break
        case "cycle":
          aValue = a.cycle_number || 0
          bValue = b.cycle_number || 0
          break
        case "date":
          aValue = a.cycle_start_date ? new Date(a.cycle_start_date).getTime() : 0
          bValue = b.cycle_start_date ? new Date(b.cycle_start_date).getTime() : 0
          break
        case "status":
          aValue = a.status?.toLowerCase() || ""
          bValue = b.status?.toLowerCase() || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return buildingSortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return buildingSortOrder === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [props.buildings, buildingSortBy, buildingSortOrder, selectedCycle])

  const handleSort = (sortBy: "name" | "cycle" | "date" | "status") => {
    if (buildingSortBy === sortBy) {
      setBuildingSortOrder(buildingSortOrder === "asc" ? "desc" : "asc")
    } else {
      setBuildingSortBy(sortBy)
      setBuildingSortOrder("asc")
    }
  }

  const getSortIcon = (sortBy: "name" | "cycle" | "date" | "status") => {
    if (buildingSortBy !== sortBy) return <ArrowUpDown className="w-4 h-4" />
    return buildingSortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader
        title="Owner Farm Dashboard"
        subtitle={`Welcome back, ${props.userEmail}`}
        userEmail={props.userEmail}
        farmId={props.farmId}
        onHomeClick={props.onBackToLanding}
        onSignOut={handleSignOut}
      />
      
      <div className="max-w-7xl mx-auto p-4">

        {/* Only show buildings list in read-only mode for worker view */}
        {props.isWorkerView ? (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Buildings</h2>
            {props.buildings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Home className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="font-medium">No buildings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {props.buildings.map((building) => (
                  <div
                    key={building.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Home className="text-gray-400" size={16} />
                      <span className="font-medium">{building.name}</span>
                    </div>
                    {/* No edit/delete buttons */}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ... existing code for full dashboard with tabs, add/edit/delete, etc ...
          <>
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex flex-wrap gap-2 px-4 sm:px-6">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "overview"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("participants")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "participants"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Staff ({props.participants.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("buildings")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "buildings"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Buildings ({props.buildings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("benchmark")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "benchmark"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Benchmark
                  </button>
                  <button
                    onClick={() => setActiveTab("cost-input")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "cost-input"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Cost Input
                  </button>
                  <button
                    onClick={() => setActiveTab("harvest-input")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "harvest-input"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Harvest Input
                  </button>
                  <button
                    onClick={() => setActiveTab("harvest-output")}
                    className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === "harvest-output"
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Harvest Output
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Quick Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <h3 className="text-lg font-semibold px-4 pt-4 dark:text-white">Staff Members</h3>
                        <CardContent>
                          <div className="text-3xl font-bold dark:text-white">{props.participants.length}</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Active staff accounts</p>
                          <Button 
                            type="button"
                            className="mt-4 w-full" 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              props.onAddParticipant()
                            }}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Add Staff
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <h3 className="text-lg font-semibold px-4 pt-4 dark:text-white">Buildings</h3>
                        <CardContent>
                          <div className="text-3xl font-bold dark:text-white">{props.buildings?.length || 0}</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Farm buildings</p>
                          <Button 
                            type="button"
                            className="mt-4 w-full" 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              props.onAddBuilding()
                            }}
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Add Building
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Only show performance analytics if there are buildings */}
                    {props.buildings && props.buildings.length > 0 ? (
                      <>
                        <BuildingAwarePerformanceDashboard farmId={props.buildings[0]?.farm_id || "default-farm-id"} />
                        <PerformanceBenchmark />
                      </>
                    ) : (
                      <Card>
                        <CardContent className="p-8">
                          <div className="text-center">
                            <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Buildings Added Yet</h3>
                            <p className="text-gray-600 mb-4">Add buildings to your farm to see performance analytics and benchmarks.</p>
                            <Button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                props.onAddBuilding()
                              }} 
                              className="w-full sm:w-auto"
                            >
                              <Home className="w-4 h-4 mr-2" />
                              Add Your First Building
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {/* Building List section removed as requested */}
                  </div>
                )}

                {activeTab === "participants" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                      <div>
                        <h2 className="text-xl font-semibold dark:text-white">Staff Access Codes</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Share these codes with your staff for login</p>
                      </div>
                      <Button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          props.onAddParticipant()
                        }} 
                        className="w-full sm:w-auto"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Add Staff
                      </Button>
                    </div>

                    {props.participants.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <User className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="font-medium">No staff members added yet</p>
                        <p className="text-sm">Add staff members to generate access codes</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {props.participants.map((participant) => (
                          <div 
                            key={participant.id} 
                            className="flex flex-col sm:flex-row sm:items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors space-y-3 sm:space-y-0"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white truncate">{participant.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  Access: {participant.access_tools?.join(', ') || 'Standard access'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                              <div className="text-center sm:text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Access Code</p>
                                <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-block">
                                  {participant.code}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-center sm:justify-start space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(participant.code)}
                                  className={`transition-all duration-200 ${
                                    copiedCode === participant.code 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' 
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title="Copy access code"
                                >
                                  {copiedCode === participant.code ? (
                                    <>
                                      <Check className="w-4 h-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Copy</span>
                                    </>
                                  )}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => props.onEditParticipant?.(participant.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <span className="sm:hidden">Edit</span>
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => props.onDeleteParticipant?.(participant.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <span className="sm:hidden">Del</span>
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "buildings" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                      <h2 className="text-xl font-semibold dark:text-white">Buildings</h2>
                      <Button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          props.onAddBuilding()
                        }} 
                        className="w-full sm:w-auto"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Add Building
                      </Button>
                    </div>

                    {/* Cycle Filter */}
                    {props.buildings.length > 0 && uniqueCycles.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Cycle:</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedCycle !== null ? `Showing Cycle #${selectedCycle}` : "Showing All Cycles"}
                            {" "}({sortedBuildings.length} buildings)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={selectedCycle === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCycle(null)}
                            className={selectedCycle === null ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                          >
                            All Cycles
                          </Button>
                          {uniqueCycles.map((cycle) => (
                            <Button
                              key={cycle}
                              variant={selectedCycle === cycle ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedCycle(cycle)}
                              className={selectedCycle === cycle ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                            >
                              Cycle #{cycle}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sorting Controls */}
                    {props.buildings.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {buildingSortBy === "name" && "Building Name"}
                            {buildingSortBy === "cycle" && "Cycle Number"}
                            {buildingSortBy === "date" && "Start Date"}
                            {buildingSortBy === "status" && "Status"}
                            {" "}({buildingSortOrder === "asc" ? "A-Z" : "Z-A"})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSort("name")}
                            className={`flex items-center space-x-1 ${
                              buildingSortBy === "name" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" : ""
                            }`}
                          >
                            {getSortIcon("name")}
                            <span>Name</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSort("cycle")}
                            className={`flex items-center space-x-1 ${
                              buildingSortBy === "cycle" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" : ""
                            }`}
                          >
                            {getSortIcon("cycle")}
                            <span>Cycle</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSort("date")}
                            className={`flex items-center space-x-1 ${
                              buildingSortBy === "date" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" : ""
                            }`}
                          >
                            {getSortIcon("date")}
                            <span>Start Date</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSort("status")}
                            className={`flex items-center space-x-1 ${
                              buildingSortBy === "status" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" : ""
                            }`}
                          >
                            {getSortIcon("status")}
                            <span>Status</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {props.buildings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Home className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="font-medium">No buildings added yet</p>
                        <p className="text-sm">Add buildings to organize your farm</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sortedBuildings.map((building) => (
                          <div key={building.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0">
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                {/* Cycle Badge */}
                                {building.cycle_number && (
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                                      <span className="text-sm font-bold text-blue-700">
                                        #{building.cycle_number}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium truncate dark:text-white">{building.name}</h3>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>
                                      Status:{" "}
                                      <span
                                        className={`${
                                          building.status === "active"
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-yellow-600 dark:text-yellow-400"
                                        }`}
                                      >
                                        {building.status || 'Active'}
                                      </span>
                                    </p>
                                    {building.cycle_start_date && (
                                      <p className="truncate">
                                        Start Date: <span className="font-medium text-blue-600 dark:text-blue-400">
                                          {new Date(building.cycle_start_date).toLocaleDateString()}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-center sm:justify-start space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => props.onViewBuilding?.(building.id)}
                                  className="text-gray-700 hover:text-gray-900"
                                >
                                  <span className="sm:hidden">View</span>
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => props.onEditBuilding?.(building.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <span className="sm:hidden">Edit</span>
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => props.onDeleteBuilding?.(building.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <span className="sm:hidden">Del</span>
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "benchmark" && (
                  <>
                    {props.buildings && props.buildings.length > 0 ? (
                      <PerformanceBenchmark />
                    ) : (
                      <Card>
                        <CardContent className="p-8">
                          <div className="text-center">
                            <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Buildings Added Yet</h3>
                            <p className="text-gray-600 mb-4">Add buildings to your farm to see performance benchmarks.</p>
                            <Button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                props.onAddBuilding()
                              }} 
                              className="w-full sm:w-auto"
                            >
                              <Home className="w-4 h-4 mr-2" />
                              Add Your First Building
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {activeTab === "cost-input" && (
                  <CostInput />
                )}

                {activeTab === "harvest-input" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Harvest Input Management</h2>
                    <p className="text-gray-600 dark:text-gray-400">Select a building to add harvest input records.</p>
                    
                    {props.buildings && props.buildings.length > 0 ? (
                      <div className="grid gap-4">
                        {props.buildings.map((building) => (
                          <div key={building.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="text-lg font-semibold dark:text-white">{building.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Cycle #{building.cycle_number || 1} | Status: {building.status || 'Active'}
                                </p>
                              </div>
                            </div>
                            <HarvestInputComponent
                              buildingId={building.id}
                              farmId={building.farm_id || ''}
                              cycleNumber={building.cycle_number || 1}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No buildings available. Please add buildings first.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "harvest-output" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Harvest Output & Performance</h2>
                    <p className="text-gray-600 dark:text-gray-400">View harvest performance and financial analysis for each building.</p>
                    
                    {props.buildings && props.buildings.length > 0 ? (
                      <div className="grid gap-6">
                        {props.buildings.map((building) => (
                          <div key={building.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div className="mb-4">
                              <h3 className="text-xl font-semibold dark:text-white">{building.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cycle #{building.cycle_number || 1} | Status: {building.status || 'Active'}
                              </p>
                            </div>
                            <HarvestOutputComponent
                              buildingId={building.id}
                              farmId={building.farm_id || ''}
                              cycleNumber={building.cycle_number || 1}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No buildings available. Please add buildings first.</p>
                      </div>
                    )}
                  </div>
                )}

                
              </div>
            </div>
          </>
        )}
      </div>

      {/* ADG Modal */}
      {adgModalBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setAdgModalBuilding(null)}
            >
              Close
            </button>
            <h3 className="text-lg font-semibold mb-4 dark:text-white">ADG: Standard vs Actual</h3>
            <div className="h-64">
              <ADGChart data={getAdgChartDataForBuilding(adgModalBuilding)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}