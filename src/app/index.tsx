import React, { Suspense } from 'react';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

const DataProvider = React.lazy(() => import('./components/DataProvider'));


export default function App() {
  return (
    <div className={cx('base')}>
      <Suspense fallback={<p>Loading...</p>}>
        <DataProvider>
          ...
        </DataProvider>
      </Suspense>
    </div>
  );
}
