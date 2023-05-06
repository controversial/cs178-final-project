import React from 'react';
import useElementSize from '../../helpers/use-element-size';

import classNames from 'classnames/bind';
import styles from './ChartWrapper.module.scss';
const cx = classNames.bind(styles);


export default function wrapChart<T>(
  Component: React.ComponentType<{ width: number, height: number } & T>,
) {
  return function WrappedChart(props: Omit<T, 'width' | 'height'>) {
    const [baseRef, [width, height]] = useElementSize();
    return (
      <div className={cx('base')} ref={baseRef}>
        {width != null && height != null && (
          <Component width={width} height={height} {...props as T} />
        )}
      </div>
    );
  };
}
