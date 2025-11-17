import React from "react";

interface Building {
  id: string;
  name: string;
  status: string;
  cycle_number?: number;
  cycle_start_date?: string;
}

interface BuildingListProps {
  buildings: Building[];
  onViewBuilding: (id: string) => void;
}

export function BuildingList({ buildings, onViewBuilding }: BuildingListProps) {
  return (
    <div className="space-y-2 mt-6">
      {buildings.length === 0 ? (
        <div className="text-gray-500">No buildings available.</div>
      ) : (
        buildings.map((building) => (
          <div
            key={building.id}
            className="p-4 border rounded-lg flex items-center justify-between bg-white shadow-sm"
          >
            <div>
              <div className="font-bold text-lg">{building.name}</div>
              <div className="text-sm text-gray-600">
                Status: <span>{building.status}</span>
                {building.cycle_number && <> | Cycle: {building.cycle_number}</>}
                {building.cycle_start_date && <> | Start: {building.cycle_start_date}</>}
              </div>
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={() => onViewBuilding(building.id)}
            >
              View
            </button>
          </div>
        ))
      )}
    </div>
  );
}