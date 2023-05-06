import React from 'react';
import useElementSize from '../../helpers/use-element-size';

import classNames from 'classnames';
import classNamesBinder from 'classnames/bind';
import styles from './ChartWrapper.module.scss';
const cx = classNamesBinder.bind(styles);


export default function wrapChart<T>(
  Component: React.ComponentType<T & { width: number, height: number }>,
) {
  return function WrappedChart({
    className = undefined,
    ...props
  }: {
    className?: string;
  } & Omit<T, 'width' | 'height'>) {
    const [baseRef, [width, height]] = useElementSize();
    return (
      <div className={classNames(cx('base'), className)} ref={baseRef}>
        {width != null && height != null && (
          <Component width={width} height={height} {...props as T} />
        )}
      </div>
    );
  };
}
