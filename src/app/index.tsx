import React from 'react';

import styles from './index.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

import('./data').then(console.log);

export default function App() {
  return (
    <div className={cx('base')}>
      <h1>CS178 Final Project</h1>
    </div>
  );
}
