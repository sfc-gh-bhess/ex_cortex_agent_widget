/**
 * Column chart: total order quantity per store for a date range (Snowflake ORDERS).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchSalesByStore, SalesByStoreRow } from '../services/salesApi';

const DEFAULT_START = '2024-01-01';
const DEFAULT_END = '2024-12-31';

export const SalesByStoreChart: React.FC = () => {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [rows, setRows] = useState<SalesByStoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: data } = await fetchSalesByStore(startDate, endDate);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sales data.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = rows.map((r) => ({
    storeLabel: String(r.storeId),
    total: r.total,
  }));

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sales by store
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total quantity across all menu items per store (from Snowflake{' '}
        <code>orders</code>). Adjust the date range and the chart refreshes.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          label="Start"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!loading && error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      {!loading && !error && chartData.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No rows returned for this range.
        </Typography>
      )}

      {!loading && !error && chartData.length > 0 && (
        <Box sx={{ width: '100%', height: 320, overflow: 'visible' }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 12, bottom: 28 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="storeLabel"
                label={{ value: 'Store', position: 'insideBottom', offset: -4 }}
              />
              <YAxis
                width={72}
                tickMargin={8}
                label={{
                  value: 'Total quantity',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip />
              <Bar dataKey="total" fill="#8884d8" name="Total quantity" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};
