'use client';

import Image from "next/image";

import ManagerView from '@/app/components/ManagerView';

export default function Home() {
  const handleOpenSpectator = () => {
    window.open('/spectator', '_blank');
  };

  const handleOpenReport = () => {
    window.open('/report', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" width="40" height="40" alt="Derby Master Logo" className="h-10 w-10" />
            <h1 className="text-2xl font-bold">Derby Master</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenReport}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-md transition-colors text-sm font-medium"
            >
              Print Report
            </button>
            <button
              onClick={handleOpenSpectator}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-md transition-colors text-sm font-medium"
            >
              Open Spectator View
            </button>
          </div>
        </div>
      </header>

      <main>
        <ManagerView />
      </main>
    </div>
  );
}
