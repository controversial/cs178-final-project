import React, { Suspense } from 'react';

import Dashboard from './Dashboard';
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
