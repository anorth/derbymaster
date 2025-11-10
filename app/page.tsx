'use client';

import ManagerView from '@/app/components/ManagerView';

export default function Home() {
  const handleOpenSpectator = () => {
    window.open('/spectator', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">DerbyMaster</h1>
          <button
            onClick={handleOpenSpectator}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-md transition-colors text-sm font-medium"
          >
            Open Spectator View
          </button>
        </div>
      </header>

      <main>
        <ManagerView />
      </main>
    </div>
  );
}
