import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { 
  Home, 
  RefreshCw, 
  Building2, 
  Calendar, 
  TrendingUp, 
  Users, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  User,
  Shield,
  BarChart3,
  Calculator
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NavigationHeader } from "../ui/navigation-header";
import { BroilerCalculator } from "../calculator/broiler-calculator";

interface Building {
  id: string;
  name: string;
  status: 'active' | 'preparing' | 'inactive' | 'maintenance';
  cycle_number?: number;
  cycle_start_date?: string;
  farm_id: string;
  created_at: string;
}

interface ProductionInputStaffDashboardProps {
  participant?: {
    name: string;
    access_tools: string[];
    building_access?: string[]; // Array of building IDs this staff can access
  };
  onSignOut?: () => void;
  farmId?: string;
}

export function ProductionInputStaffDashboard({ 
  participant = { name: "Staff Member", access_tools: ["Production Input"], building_access: [] }, 
  onSignOut,
  farmId 
}: ProductionInputStaffDashboardProps) {
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "cycle" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [activeTab, setActiveTab] = useState<"buildings" | "production-input">("buildings");

  // Fetch buildings data with multiple fallback strategies
  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏗️ STAFF DASHBOARD - Fetching buildings with fallback strategies...');
      console.log('📊 Farm ID passed:', farmId);
      console.log('👤 Participant:', participant);
      
      let targetFarmId = farmId;
      let buildingsData = null;
      let buildingsError = null;
      
      // Strategy 1: Use provided farmId
      if (targetFarmId && targetFarmId.trim() !== '') {
        console.log('🎯 Strategy 1: Using provided farm ID:', targetFarmId);
        
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .eq('farm_id', targetFarmId)
          .order('created_at', { ascending: false });
        
        buildingsData = data;
        buildingsError = error;
      }
      
      // Strategy 2: Get farm ID from participant
      if (buildingsError || !buildingsData || buildingsData.length === 0) {
        console.log('🔄 Strategy 2: Trying to get farm ID from participant...');
        
        if (participant && (participant as any).farm_id) {
          targetFarmId = (participant as any).farm_id;
          console.log('✅ Got farm ID from participant:', targetFarmId);
          
          const { data, error } = await supabase
            .from('buildings')
            .select('*')
            .eq('farm_id', targetFarmId)
            .order('created_at', { ascending: false });
          
          buildingsData = data;
          buildingsError = error;
        }
      }
      
      // Strategy 3: Get any farm ID from farms table
      if (buildingsError || !buildingsData || buildingsData.length === 0) {
        console.log('🔄 Strategy 3: Getting any farm ID from farms table...');
        
        const { data: farms, error: farmsError } = await supabase
          .from('farms')
          .select('id')
          .limit(1);
        
        if (!farmsError && farms && farms.length > 0) {
          targetFarmId = farms[0].id;
          console.log('✅ Got farm ID from farms table:', targetFarmId);
          
          const { data, error } = await supabase
            .from('buildings')
            .select('*')
            .eq('farm_id', targetFarmId)
            .order('created_at', { ascending: false });
          
          buildingsData = data;
          buildingsError = error;
        }
      }
      
      // Strategy 4: Get all buildings (fallback)
      if (buildingsError || !buildingsData || buildingsData.length === 0) {
        console.log('🔄 Strategy 4: Getting all buildings (fallback)...');
        
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .order('created_at', { ascending: false });
        
        buildingsData = data;
        buildingsError = error;
      }
      
      if (buildingsError) {
        console.error('❌ All strategies failed:', buildingsError);
        throw new Error(`Failed to fetch buildings: ${buildingsError.message || 'Unknown error'}`);
      }
      
      console.log('✅ Buildings query successful');
      console.log('📊 Buildings data:', buildingsData);
      console.log('📊 Buildings count:', buildingsData?.length || 0);
      console.log('📊 Target Farm ID used:', targetFarmId);
      console.log('📊 All buildings in database:', buildingsData);
      
      // Apply building access control AFTER fetching
      let filteredBuildings = buildingsData || [];
      
      // If staff has specific building access, filter by those buildings
      if (participant.building_access && participant.building_access.length > 0) {
        filteredBuildings = buildingsData?.filter(building => 
          participant.building_access!.includes(building.id)
        ) || [];
        console.log('🔒 Filtered by building access:', participant.building_access);
        console.log('🔒 Filtered buildings count:', filteredBuildings.length);
      } else {
        console.log('🌐 No building access restrictions - showing all buildings');
      }
      
      setBuildings(filteredBuildings);
      console.log('✅ Buildings loaded for staff:', filteredBuildings.length);
      
    } catch (err) {
      console.error('❌ Error fetching buildings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch buildings');
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered - farmId:', farmId, 'participant:', participant);
    fetchBuildings();
  }, [farmId, participant.building_access]);

  // Filter and sort buildings
  const filteredBuildings = buildings
    .filter(building => {
      const matchesSearch = building.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || building.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'cycle':
          comparison = (a.cycle_number || 0) - (b.cycle_number || 0);
          break;
        case 'date':
          comparison = new Date(a.cycle_start_date || a.created_at).getTime() - 
                      new Date(b.cycle_start_date || b.created_at).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'maintenance': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Clock className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Check if staff has access to Production Input
  const hasProductionInputAccess = participant.access_tools.includes("Production Input");

  if (!hasProductionInputAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You do not have access to Production Input features.
            </p>
            <Button onClick={onSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <NavigationHeader
        title="Production Input Dashboard"
        subtitle={`Welcome, ${participant.name}`}
        farmId={farmId}
        onSignOut={onSignOut}
        onHomeClick={() => {}} // Staff dashboard doesn't have a home button
      />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Production Input
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Input production data for your assigned buildings
              </p>
              {participant.building_access && participant.building_access.length > 0 ? (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Access limited to {participant.building_access.length} specific building(s)
                </p>
              ) : (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Access to all buildings in your farm
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={fetchBuildings}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "buildings" | "production-input")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buildings" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Buildings</span>
            </TabsTrigger>
            <TabsTrigger value="production-input" className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Production Input</span>
            </TabsTrigger>
          </TabsList>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Buildings</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{buildings.length}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Buildings</p>
                      <p className="text-2xl font-bold text-green-600">
                        {buildings.filter(b => b.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Preparation</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {buildings.filter(b => b.status === 'preparing').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Maintenance</p>
                      <p className="text-2xl font-bold text-red-600">
                        {buildings.filter(b => b.status === 'maintenance').length}
                      </p>
                    </div>
                    <Settings className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search buildings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="preparing">Preparing</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="name">Name</option>
                      <option value="status">Status</option>
                      <option value="cycle">Cycle</option>
                      <option value="date">Date</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buildings Grid */}
            {loading ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading buildings...</p>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-12">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Buildings</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button onClick={fetchBuildings} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
             ) : filteredBuildings.length === 0 ? (
               <Card className="bg-white dark:bg-gray-800 shadow-lg">
                 <CardContent className="p-12">
                   <div className="text-center">
                     <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                       {searchTerm || statusFilter !== "all" ? "No buildings match your filters" : "No buildings found"}
                     </h3>
                     <p className="text-gray-600 dark:text-gray-400 mb-4">
                       {searchTerm || statusFilter !== "all" 
                         ? "Try adjusting your search or filter criteria" 
                         : "No buildings have been added to your farm yet. Contact your administrator to add buildings."
                       }
                     </p>
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                       <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Setup Required</h4>
                       <p className="text-sm text-blue-800 dark:text-blue-200">
                         The farm owner needs to add buildings first. Once buildings are added, they will appear here automatically.
                       </p>
                     </div>
                     <Button onClick={fetchBuildings} variant="outline">
                       Refresh Data
                     </Button>
                   </div>
                 </CardContent>
               </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuildings.map((building) => (
                  <Card key={building.id} className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                              {building.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Cycle #{building.cycle_number || 1}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(building.status)} flex items-center space-x-1`}>
                          {getStatusIcon(building.status)}
                          <span className="capitalize">{building.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {building.cycle_start_date && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Started: {new Date(building.cycle_start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>Building ID: {building.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              setSelectedBuilding(building);
                              setActiveTab("production-input");
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Input Data
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Production Input Tab */}
          <TabsContent value="production-input" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Production Input
              </h2>
              
              {selectedBuilding ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {selectedBuilding.name}
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300">
                        Cycle #{selectedBuilding.cycle_number || 1} | Status: {selectedBuilding.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBuilding(null)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Change Building
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <BroilerCalculator
                      buildingId={selectedBuilding.id}
                      buildingName={selectedBuilding.name}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Building
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Choose a building from the Buildings tab to start inputting production data.
                  </p>
                  <Button
                    onClick={() => setActiveTab("buildings")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    View Buildings
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Debug Panel */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mt-8">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Staff Dashboard Debug - Same Logic as Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Farm ID (Owner's)</p>
                <p className="text-yellow-700 dark:text-yellow-300">{farmId || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Buildings Count</p>
                <p className="text-yellow-700 dark:text-yellow-300">{buildings.length}</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Loading</p>
                <p className="text-yellow-700 dark:text-yellow-300">{loading ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Error</p>
                <p className="text-yellow-700 dark:text-yellow-300">{error || 'None'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Participant Name</p>
                <p className="text-yellow-700 dark:text-yellow-300">{participant.name}</p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Building Access</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  {participant.building_access?.length || 0} specific buildings
                </p>
              </div>
            </div>
             <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded">
               <p className="text-xs text-yellow-800 dark:text-yellow-200">
                 <strong>Data Flow:</strong> Staff dashboard uses the SAME farm ID as owner dashboard. 
                 If no buildings show, check that the owner has buildings in their farm.
               </p>
               <div className="mt-2 flex space-x-2">
                 <Button 
                   size="sm" 
                   variant="outline"
                   onClick={async () => {
                     console.log('🔍 Testing database connection...');
                     const { data: allBuildings, error } = await supabase
                       .from('buildings')
                       .select('*');
                     console.log('🔍 All buildings in database:', allBuildings);
                     console.log('🔍 Error:', error);
                   }}
                   className="text-xs"
                 >
                   Test DB Connection
                 </Button>
                 <Button 
                   size="sm" 
                   variant="outline"
                   onClick={async () => {
                     console.log('🔍 Testing farms table...');
                     const { data: farms, error } = await supabase
                       .from('farms')
                       .select('*');
                     console.log('🔍 All farms in database:', farms);
                     console.log('🔍 Error:', error);
                   }}
                   className="text-xs"
                 >
                   Test Farms
                 </Button>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
