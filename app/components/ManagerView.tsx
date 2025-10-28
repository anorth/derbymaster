'use client';

import { useState } from 'react';
import { ConfigurationTab } from './ConfigurationTab';
import { RegistrationTab } from './RegistrationTab';
import { ExecutionTab } from './ExecutionTab';

type Tab = 'configuration' | 'registration' | 'execution';

export default function ManagerView() {
  const [activeTab, setActiveTab] = useState<Tab>('configuration');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('configuration')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'configuration'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('registration')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'registration'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Registration
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'execution'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Execution
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <main className="p-4">
        {activeTab === 'configuration' && <ConfigurationTab />}
        {activeTab === 'registration' && <RegistrationTab />}
        {activeTab === 'execution' && <ExecutionTab />}
      </main>
    </div>
  );
}
