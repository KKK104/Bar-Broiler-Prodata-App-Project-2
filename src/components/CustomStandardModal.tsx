import React, { useState } from "react";
import { Button } from "./ui/button";

interface CustomBenchmark {
  name: string;
  fcr: number;
  adg: number;
  mortality: number;
}

interface CustomStandardModalProps {
  onClose: () => void;
  onSave: (benchmark: CustomBenchmark) => void;
}

export default function CustomStandardModal({ onClose, onSave }: CustomStandardModalProps) {
  const [name, setName] = useState("");
  const [fcr, setFcr] = useState("");
  const [adg, setAdg] = useState("");
  const [ages, setAges] = useState<{ age: number; mortality: number; }[]>([{ age: 1, mortality: 0 }]);

  const handleAddAge = () => setAges([...ages, { age: 0, mortality: 0 }]);
  const handleChange = (i: number, field: "age" | "mortality", value: string) => {
    const copy = [...ages];
    copy[i][field] = Number(value);
    setAges(copy);
  };
  const handleDelete = (i: number) => setAges(ages.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave({
      name,
      fcr: parseFloat(fcr),
      adg: parseFloat(adg),
      mortality: ages[0].mortality, // Already a number
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-2">Create Custom Standard</h2>
        <p className="mb-4 text-gray-500">Define your own performance benchmark standard with mortality rates by age</p>
        <div className="mb-2">
          <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Standard Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Target FCR (Optional)" value={fcr} onChange={e => setFcr(e.target.value)} />
          <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Target ADG (Optional)" value={adg} onChange={e => setAdg(e.target.value)} />
        </div>
        <div className="mb-2">
          <b>Mortality Standards by Age</b>
          <table className="w-full mt-2">
            <thead>
              <tr>
                <th>Age (Days)</th>
                <th>Cumulative Mortality (%)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ages.map((row, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={row.age}
                      onChange={e => handleChange(i, "age", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={row.mortality}
                      onChange={e => handleChange(i, "mortality", e.target.value)}
                    />
                  </td>
                  <td>
                    <Button variant="outline" onClick={() => handleDelete(i)}>🗑️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button className="mt-2" onClick={handleAddAge}>+ Add Age</Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave}>Save Standard</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
