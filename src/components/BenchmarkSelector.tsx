"use client"
import { Button } from "./ui/button"

interface BenchmarkSelectorProps {
  selectedBenchmark: string
  onBenchmarkChange: (benchmark: string) => void
  onAddCustomStandard?: () => void
}

export function BenchmarkSelector({
  selectedBenchmark,
  onBenchmarkChange,
  onAddCustomStandard
}: BenchmarkSelectorProps) {
  const benchmarks = [
    { value: "", label: "None" },
    { value: "Ross", label: "ROSS" },
    { value: "Cobb", label: "COBB" },
    { value: "Arbor Acres", label: "Arbor Acres" },
    { value: "Indian River", label: "Indian River" },
  ]

  return (
    <div className="mb-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
      <label htmlFor="benchmark-preset" className="font-semibold block sm:inline">
        Performance Benchmark Standard:
      </label>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
        <select
          id="benchmark-preset"
          className="border rounded px-2 py-1 w-full sm:w-auto dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          value={selectedBenchmark}
          onChange={(e) => onBenchmarkChange(e.target.value)}
        >
          {benchmarks.map((benchmark) => (
            <option key={benchmark.value} value={benchmark.value}>
              {benchmark.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          className="border rounded px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm w-full sm:w-auto"
          onClick={onAddCustomStandard}
        >
          Add Custom Standard
        </Button>
      </div>
    </div>
  )
}
