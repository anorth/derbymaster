'use client';

import { useState } from 'react';
import ManagerView from '@/app/components/ManagerView';
import SpectatorView from '@/app/components/SpectatorView';

type View = 'manager' | 'spectator';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('manager');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">DerbyMaster</h1>
          <button
            onClick={() => setCurrentView(currentView === 'manager' ? 'spectator' : 'manager')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-md transition-colors text-sm font-medium"
          >
            {currentView === 'manager' ? 'Spectator View' : 'Manager View'}
          </button>
        </div>
      </header>

      <main>
        {currentView === 'manager' ? <ManagerView /> : <SpectatorView />}
      </main>
    </div>
  );
}
