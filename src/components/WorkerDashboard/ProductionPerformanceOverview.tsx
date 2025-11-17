
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Building } from "lucide-react";

interface BuildingPerformance {
  id: string;
  name: string;
  status: string;
  cycle_number?: number;
  cycle_start_date?: string;
  summary?: {
    liveBirds?: number;
    mortality?: number;
    fcr?: number;
    avgWeight?: number;
  };
}

interface FarmPerformance {
  totalMortality: number;
  avgFCR: number | null;
  avgWeight: number | null;
}

interface Props {
  farmPerformance: FarmPerformance;
  buildings: BuildingPerformance[];
}

function getFcrColor(fcr?: number) {
  if (fcr === undefined) return "bg-gray-100";
  if (fcr > 2.2) return "bg-red-100 text-red-700";
  if (fcr > 1.8) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}
function getMortalityColor(mortality?: number) {
  if (mortality === undefined) return "bg-gray-100";
  if (mortality > 5) return "bg-red-100 text-red-700";
  if (mortality > 2.5) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}
function getWeightColor(avgWeight?: number) {
  if (avgWeight === undefined) return "bg-gray-100";
  if (avgWeight < 1500) return "bg-red-100 text-red-700";
  if (avgWeight < 1800) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export function ProductionPerformanceOverview({ farmPerformance, buildings }: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Farm-wide Performance Summary */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-1">Farm Performance Overview</h3>
            <div className="text-xs sm:text-sm text-gray-500">All buildings (active cycle)</div>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-8">
            <div>
              <div className="text-xs text-gray-500">Total Mortality</div>
              <div className={`text-lg sm:text-xl font-bold px-2 py-1 rounded ${getMortalityColor(farmPerformance.totalMortality)}`}>{farmPerformance.totalMortality ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Avg FCR</div>
              <div className={`text-lg sm:text-xl font-bold px-2 py-1 rounded ${getFcrColor(farmPerformance.avgFCR ?? undefined)}`}>{farmPerformance.avgFCR !== null ? farmPerformance.avgFCR.toFixed(2) : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Avg Weight (g)</div>
              <div className={`text-lg sm:text-xl font-bold px-2 py-1 rounded ${getWeightColor(farmPerformance.avgWeight ?? undefined)}`}>{farmPerformance.avgWeight !== null ? farmPerformance.avgWeight.toFixed(0) : "-"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Building Performance List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {buildings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Building className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mb-3 sm:mb-4" />
              <div className="text-gray-500 font-medium text-sm sm:text-base">No buildings to show</div>
            </CardContent>
          </Card>
        ) : (
          buildings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <div>
                    <div className="font-semibold text-base sm:text-lg">{b.name}</div>
                    <div className="text-xs text-gray-500">Status: {b.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-2">
                  <div>
                    <div className="text-xs text-gray-500">Live Birds</div>
                    <div className="font-bold text-sm sm:text-base">{b.summary?.liveBirds ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mortality (%)</div>
                    <div className={`font-bold text-sm sm:text-base px-2 py-1 rounded ${getMortalityColor(b.summary?.mortality)}`}>{b.summary?.mortality !== undefined ? b.summary.mortality.toFixed(2) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">FCR</div>
                    <div className={`font-bold text-sm sm:text-base px-2 py-1 rounded ${getFcrColor(b.summary?.fcr)}`}>{b.summary?.fcr !== undefined ? b.summary.fcr.toFixed(2) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Avg Weight (g)</div>
                    <div className={`font-bold text-sm sm:text-base px-2 py-1 rounded ${getWeightColor(b.summary?.avgWeight)}`}>{b.summary?.avgWeight !== undefined ? b.summary.avgWeight.toFixed(0) : "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

