import { Table } from 'apache-arrow';
import { useEffect, useState } from 'react';
import { useGlobalContext } from '../components/GlobalContext';

import { conn } from '../data/database';
import '../../data/sensor-readings'; // Wait for the data we need to be loaded into the database

export default function useDbQuery(statements: string[], columns: string[] = ['*']) {
  const { filters } = useGlobalContext();
  const [res, setRes] = useState<Table<any>>();

  useEffect(() => {
    const columnsJoined = `SELECT ${columns.join(' ')} FROM sensor_readings `;
    const filtersJoined = Object.values(filters).map((v) => v.join(' ')).join(' ');

    const doQuery = async () => (conn.query(columnsJoined + statements.join(' ') + filtersJoined));

    doQuery().then(setRes);
  }, [columns, filters, statements]);

  return res;
}
