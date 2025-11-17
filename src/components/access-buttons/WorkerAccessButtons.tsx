import { Button } from "../ui/button";
import { Users } from "lucide-react";

interface WorkerAccessButtonsProps {
  onInput: () => void;
  onPerformance: () => void;
}

export function WorkerAccessButtons({ onInput, onPerformance }: WorkerAccessButtonsProps) {
  return (
    <div className="flex gap-8 justify-center mt-16 flex-wrap">
      <Button
        className="w-80 h-32 text-left border-2 border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:shadow-lg hover:border-blue-600 transition-all flex flex-col items-start justify-center p-8 text-lg font-semibold"
        onClick={() => {
          onInput();
        }}
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span>Production Input</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">Access granted</span>
      </Button>
      <Button
        className="w-80 h-32 text-left border-2 border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:shadow-lg hover:border-blue-600 transition-all flex flex-col items-start justify-center p-8 text-lg font-semibold"
        onClick={() => {
          onPerformance();
        }}
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span>Production Performance</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">Access granted</span>
      </Button>
    </div>
  );
} 