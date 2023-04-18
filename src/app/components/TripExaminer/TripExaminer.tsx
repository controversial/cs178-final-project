import React from 'react';

import { useGlobalContext } from '../GlobalContext';

import styles from './TripExaminer.module.scss';
import classNames from 'classnames';
const cx = classNames.bind(styles);

interface ITripExaminerProps {

}

export default function TripExaminer(props: ITripExaminerProps) {
  const ctx = useGlobalContext();

  return (
    <div className={cx('base')} />
  );
}
