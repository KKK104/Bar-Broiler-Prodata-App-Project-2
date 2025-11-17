'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Edit, Building, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDailyRecords } from '@/hooks/useDailyRecords'

interface CostItem {
  id: string
  category: string
  description: string
  quantity: number
  unitPrice: number
  totalCost: number
  date: string
  buildingId: string
  farmId: string
}

interface CostData {
  expected: CostItem[]
  actual: CostItem[]
}

interface Building {
  id: string
  name: string
  farm_id: string
  status: string
  cycle_number?: number
  cycle_start_date?: string
}

interface Farm {
  id: string
  name: string
  owner_id: string
  building_count: number
}

const defaultCategories = [
  'Farm Rent',
  'Labor',
  'Day-Old-Chicks (DOC)',
  'Composite Feeds',
  'Composite Vaccine',
  'Composite Antibacterials',
  'Composite Supplements',
  'Chick Paper',
  'LPG',
  'Electricity',
  'Fly Control',
  'Lime (Apog)',
  'Other'
]

interface CostInputProps {
  farmId?: string
  buildingId?: string
}

export default function CostInput({ farmId: propFarmId, buildingId: propBuildingId }: CostInputProps = {}) {
  const [costData, setCostData] = useState<CostData>({
    expected: [],
    actual: []
  })
  const [activeTab, setActiveTab] = useState<'expected' | 'actual'>('expected')
  const [selectedFarmId, setSelectedFarmId] = useState<string>(propFarmId || '')
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(propBuildingId || 'all')
  const [farms, setFarms] = useState<Farm[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  
  const [newItem, setNewItem] = useState({
    category: 'Farm Rent',
    description: '',
    quantity: 0,
    unitPrice: 0,
    date: new Date().toISOString().split('T')[0]
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  
  // Use daily records hook to get building performance data
  const { buildingPerformance } = useDailyRecords(selectedFarmId || 'default-farm-id')

  // Load farms and buildings on component mount
  useEffect(() => {
    loadFarms()
  }, [])

  useEffect(() => {
    if (selectedFarmId) {
      loadBuildings(selectedFarmId)
    } else {
      setBuildings([])
    }
  }, [selectedFarmId])

  // Load cost data when farm/building selection changes
  useEffect(() => {
    if (selectedFarmId) {
      loadCostData()
    }
  }, [selectedFarmId, selectedBuildingId])

  const loadFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('name')

      if (error) throw error
      setFarms(data || [])
      
      // If no propFarmId was provided and farms exist, select the first one
      if (!propFarmId && data && data.length > 0) {
        setSelectedFarmId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading farms:', error)
    }
  }

  const loadBuildings = async (farmId: string) => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('farm_id', farmId)
        .order('name')

      if (error) throw error
      setBuildings(data || [])
    } catch (error) {
      console.error('Error loading buildings:', error)
    }
  }

  const loadCostData = async () => {
    // For now, we'll keep costs in local state
    // In a real app, you'd load from a database table like 'cost_items'
    // This is a placeholder for the data loading logic
    console.log('Loading cost data for farm:', selectedFarmId, 'building:', selectedBuildingId)
  }

  const getCurrentCostItems = () => {
    const allItems = costData[activeTab]
    
    // Filter by farm and building
    return allItems.filter(item => {
      const farmMatch = item.farmId === selectedFarmId
      const buildingMatch = selectedBuildingId === 'all' || item.buildingId === selectedBuildingId
      return farmMatch && buildingMatch
    })
  }

  const setCurrentCostItems = (items: CostItem[]) => {
    setCostData(prev => ({
      ...prev,
      [activeTab]: items
    }))
  }

  const addCostItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert('Please fill in all required fields with valid values')
      return
    }

    if (!selectedFarmId) {
      alert('Please select a farm first')
      return
    }

    if (selectedBuildingId === 'all') {
      alert('Please select a specific building to add cost items')
      return
    }

    const category = showCustomCategory && customCategory ? customCategory : newItem.category
    const totalCost = newItem.quantity * newItem.unitPrice

    const costItem: CostItem = {
      id: Date.now().toString(),
      category,
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalCost,
      date: newItem.date,
      farmId: selectedFarmId,
      buildingId: selectedBuildingId
    }

    const currentItems = costData[activeTab]
    setCurrentCostItems([...currentItems, costItem])
    
    setNewItem({
      category: 'Farm Rent',
      description: '',
      quantity: 0,
      unitPrice: 0,
      date: new Date().toISOString().split('T')[0]
    })
    setCustomCategory('')
    setShowCustomCategory(false)
  }

  const deleteCostItem = (id: string) => {
    const allItems = costData[activeTab]
    setCurrentCostItems(allItems.filter(item => item.id !== id))
  }

  const startEdit = (item: CostItem) => {
    setEditingId(item.id)
    setNewItem({
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      date: item.date
    })
  }

  const saveEdit = () => {
    if (!editingId) return

    const totalCost = newItem.quantity * newItem.unitPrice
    const allItems = costData[activeTab]
    setCurrentCostItems(allItems.map(item => 
      item.id === editingId 
        ? { ...item, ...newItem, totalCost }
        : item
    ))
    setEditingId(null)
    setNewItem({
      category: 'Farm Rent',
      description: '',
      quantity: 0,
      unitPrice: 0,
      date: new Date().toISOString().split('T')[0]
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewItem({
      category: 'Farm Rent',
      description: '',
      quantity: 0,
      unitPrice: 0,
      date: new Date().toISOString().split('T')[0]
    })
  }

  const getTotalByCategory = (category: string) => {
    const currentItems = getCurrentCostItems()
    return currentItems
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + item.totalCost, 0)
  }

  const getGrandTotal = () => {
    const currentItems = getCurrentCostItems()
    return currentItems.reduce((sum, item) => sum + item.totalCost, 0)
  }

  const getSelectedFarmName = () => {
    return farms.find(f => f.id === selectedFarmId)?.name || 'Unknown Farm'
  }

  const getSelectedBuildingName = () => {
    if (selectedBuildingId === 'all') return 'All Buildings'
    return buildings.find(b => b.id === selectedBuildingId)?.name || 'Unknown Building'
  }

  // Calculate total surviving birds for selected building(s)
  const getTotalSurvivingBirds = () => {
    if (!buildingPerformance || buildingPerformance.length === 0) {
      return 0
    }

    if (selectedBuildingId === 'all') {
      // Sum surviving birds from all buildings
      return buildingPerformance.reduce((total, building) => {
        return total + (building.metrics?.liveBirds || 0)
      }, 0)
    } else {
      // Get surviving birds from selected building only
      const selectedBuilding = buildingPerformance.find(b => b.buildingId === selectedBuildingId)
      return selectedBuilding?.metrics?.liveBirds || 0
    }
  }

  // Calculate cost per chicken using formula: Total Production Costs / Number of Surviving Birds
  const getCostPerChicken = () => {
    const totalCosts = getGrandTotal()
    const survivingBirds = getTotalSurvivingBirds()
    
    if (survivingBirds === 0) {
      return 0
    }
    
    return totalCosts / survivingBirds
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cost Input Management</h2>
        <p className="text-gray-600">Track expected and actual costs per building and farm</p>
      </div>

      {/* Farm and Building Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Farm & Building Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="farmSelect">Select Farm</Label>
              <select
                id="farmSelect"
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!!propFarmId} // Disable if farmId is passed as prop
              >
                <option value="">Select a farm...</option>
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="buildingSelect">Select Building</Label>
              <select
                id="buildingSelect"
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!selectedFarmId || !!propBuildingId} // Disable if no farm selected or buildingId is passed as prop
              >
                <option value="all">All Buildings (View Only)</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>{building.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedFarmId && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Home className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Farm:</span> 
                  <span className="truncate">{getSelectedFarmName()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Building:</span> 
                  <span className="truncate">{getSelectedBuildingName()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedFarmId ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Please select a farm to begin managing costs.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'expected' | 'actual')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expected" className="text-lg">Expected Costs</TabsTrigger>
            <TabsTrigger value="actual" className="text-lg">Actual Costs</TabsTrigger>
          </TabsList>

          <TabsContent value="expected" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Expected Cost Input</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedBuildingId === 'all' 
                    ? 'Viewing all buildings (add costs by selecting a specific building)'
                    : `Adding costs for ${getSelectedBuildingName()}`
                  }
                </p>
              </CardHeader>
              <CardContent>
                {selectedBuildingId !== 'all' && (
                  <>
                    {/* Add New Cost Item Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <div className="space-y-2">
                          <select
                            id="category"
                            value={showCustomCategory ? 'custom' : newItem.category}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowCustomCategory(true)
                              } else {
                                setShowCustomCategory(false)
                                setNewItem({ ...newItem, category: e.target.value })
                              }
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                          >
                            {defaultCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom">+ Add Custom Category</option>
                          </select>
                          {showCustomCategory && (
                            <Input
                              placeholder="Enter custom category"
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Item description"
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newItem.date}
                          onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder="0"
                          value={newItem.quantity || ''}
                          onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newItem.unitPrice || ''}
                          onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="flex items-end">
                        <div className="w-full">
                          <Label>Total Cost</Label>
                          <div className="p-2 bg-gray-100 rounded-md font-semibold">
                            ₱{(newItem.quantity * newItem.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      {editingId ? (
                        <>
                          <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                            Save Changes
                          </Button>
                          <Button onClick={cancelEdit} variant="outline">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={addCostItem} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Expected Cost Item
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Actual Cost Input</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedBuildingId === 'all' 
                    ? 'Viewing all buildings (add costs by selecting a specific building)'
                    : `Adding costs for ${getSelectedBuildingName()}`
                  }
                </p>
              </CardHeader>
              <CardContent>
                {selectedBuildingId !== 'all' && (
                  <>
                    {/* Add New Cost Item Form - Same form but for actual costs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="space-y-2">
                <select
                  id="category"
                  value={showCustomCategory ? 'custom' : newItem.category}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomCategory(true)
                    } else {
                      setShowCustomCategory(false)
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                >
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="custom">+ Add Custom Category</option>
                </select>
                {showCustomCategory && (
                  <Input
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Item description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newItem.date}
                onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
                                    <Label htmlFor="unitPrice">Unit Price (₱)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newItem.unitPrice || ''}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-end">
              <div className="w-full">
                <Label>Total Cost</Label>
                <div className="p-2 bg-gray-100 rounded-md font-semibold">
                                              ₱{(newItem.quantity * newItem.unitPrice).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {editingId ? (
              <>
                <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
                <Button onClick={cancelEdit} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={addCostItem} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                          Add Actual Cost Item
              </Button>
            )}
          </div>
                  </>
                )}
        </CardContent>
      </Card>
          </TabsContent>

          {/* Cost Summary by Category - Shows for current tab */}
      <Card>
        <CardHeader>
              <CardTitle>
                {activeTab === 'expected' ? 'Expected' : 'Actual'} Cost Summary by Category
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing costs for {getSelectedFarmName()} - {getSelectedBuildingName()}
              </p>
        </CardHeader>
        <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {defaultCategories.map(category => {
              const total = getTotalByCategory(category)
              return (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm text-gray-600 truncate">{category}</div>
                  <div className="text-lg font-bold text-gray-900">₱{total.toFixed(2)}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-center">
                  <div className="text-lg font-medium text-blue-600">
                    {activeTab === 'expected' ? 'Expected' : 'Actual'} Grand Total
                  </div>
                  <div className="text-2xl font-bold text-blue-900">₱{getGrandTotal().toFixed(2)}</div>
            </div>
          </div>

          {/* Cost per Chicken Section */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-medium text-green-600">
                Cost per Chicken
              </div>
              <div className="text-xl font-bold text-green-900">
                ₱{getCostPerChicken().toFixed(2)}
              </div>
              <div className="text-sm text-green-700 mt-1">
                Total Costs ÷ Surviving Birds ({getTotalSurvivingBirds().toLocaleString()} birds)
              </div>
              {getTotalSurvivingBirds() === 0 && (
                <div className="text-xs text-amber-600 mt-2">
                  * No bird data available. Add daily records to calculate cost per chicken.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Cost Items Table - Shows for current tab */}
      <Card>
        <CardHeader>
              <CardTitle>
                {activeTab === 'expected' ? 'Expected' : 'Actual'} Cost Items ({getCurrentCostItems().length})
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing costs for {getSelectedFarmName()} - {getSelectedBuildingName()}
              </p>
        </CardHeader>
        <CardContent>
              {getCurrentCostItems().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
                  No {activeTab} cost items added yet for the selected farm and building.
                  {selectedBuildingId === 'all' ? ' Select a specific building to add cost items.' : ' Add your first cost item above.'}
            </div>
          ) : (
            <div className="space-y-3">
              {getCurrentCostItems().map((item) => {
                const building = buildings.find(b => b.id === item.buildingId)
                return (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex flex-col space-y-3">
                      {/* Top row - Date, Building, Category */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600">{item.date}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {building?.name || 'Unknown'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activeTab === 'expected' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                      </div>
                      
                      {/* Bottom row - Quantity, Price, Total, Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex gap-4 text-sm">
                          <span><strong>Qty:</strong> {item.quantity}</span>
                                              <span><strong>Price:</strong> ₱{item.unitPrice.toFixed(2)}</span>
                    <span className="font-semibold text-green-600"><strong>Total:</strong> ₱{item.totalCost.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(item)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCostItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </Tabs>
      )}
    </div>
  )
} 