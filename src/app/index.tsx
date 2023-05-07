import React, { Suspense } from 'react';

import Dashboard from './components/Dashboard';
const DataProvider = React.lazy(() => import('./components/DataProvider'));


export default function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <DataProvider>
        <Dashboard />
      </DataProvider>
    </Suspense>
  );
}
