import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartVisualizationProps, VegaLiteSpec, RechartsData, CHART_COLORS } from '../types/chart';

const ChartVisualization: React.FC<ChartVisualizationProps> = ({ 
  chartContent, 
  height = 380 
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Parse chart data from various formats
  const parseChartData = (chartSpec: any): { 
    type: string; 
    data: RechartsData[]; 
    originalData: RechartsData[];
    title?: string;
  } => {
    try {
      // Handle Vega-Lite specifications (primary format)
      // Check for Vega-Lite by: $schema, or presence of required Vega-Lite fields
      const hasVegaLiteSchema = chartSpec.$schema && chartSpec.$schema.includes('vega-lite');
      const hasVegaLiteFields = chartSpec.mark && chartSpec.data && chartSpec.data.values;
      
      if (hasVegaLiteSchema || hasVegaLiteFields) {
        const vegaSpec = chartSpec as VegaLiteSpec;
        const data = vegaSpec.data.values;
        const mark = typeof vegaSpec.mark === 'string' ? vegaSpec.mark : vegaSpec.mark.type;
        
        // Store original data for table view
        const originalData = data.map((item: any, index: number) => ({ 
          id: index, 
          ...item 
        }));

        // Transform data for chart rendering
        let transformedData = [...data];

        // Handle multi-series line charts (convert from long to wide format)
        if (mark === 'line' && data.length > 0) {
          const firstItem = data[0];
          const keys = Object.keys(firstItem);
          
          // Check if this looks like multi-series data that needs pivoting
          const categoryField = keys.find(key => 
            key.toUpperCase() === 'CATEGORY' || 
            key.toLowerCase().includes('category') || 
            key.toLowerCase().includes('group') ||
            key.toLowerCase().includes('series')
          );
          
          const timeField = keys.find(key => 
            key.toLowerCase().includes('month') ||
            key.toLowerCase().includes('date') ||
            key.toLowerCase().includes('time') ||
            key.toLowerCase().includes('year') ||
            key.toLowerCase().includes('day') ||
            key.toLowerCase().includes('quarter') ||
            key.toLowerCase().includes('week') ||
            (typeof firstItem[key] === 'string' && (
              firstItem[key].includes('-') || 
              firstItem[key].includes('/') ||
              firstItem[key].match(/^\d{4}$/) // Year format
            ))
          );
          
          const valueField = keys.find(key => 
            key.toLowerCase().includes('sales') ||
            key.toLowerCase().includes('value') ||
            key.toLowerCase().includes('amount') ||
            key.toLowerCase().includes('revenue') ||
            key.toLowerCase().includes('price') ||
            key.toLowerCase().includes('cost') ||
            key.toLowerCase().includes('total') ||
            key.toLowerCase().includes('count') ||
            key.toLowerCase().includes('quantity') ||
            key.toLowerCase().includes('score') ||
            key.toLowerCase().includes('rating') ||
            key.toLowerCase().includes('percent') ||
            (key !== categoryField && key !== timeField && typeof firstItem[key] === 'number')
          );

          if (categoryField && timeField && valueField) {
            // Pivot the data from long to wide format
            const pivotMap = new Map();
            
            data.forEach((row: any) => {
              const timeKey = row[timeField];
              const category = row[categoryField];
              const value = parseFloat(row[valueField]) || 0;
              
              if (!pivotMap.has(timeKey)) {
                pivotMap.set(timeKey, { 
                  name: timeKey,
                  [timeField]: timeKey
                });
              }
              
              pivotMap.get(timeKey)[category] = value;
            });
            
            transformedData = Array.from(pivotMap.values());
          }
        }

        // Add normalized field names and ensure we have name/id fields
        transformedData = transformedData.map((item: any, index: number) => {
          const normalizedItem = { id: index, ...item };
          
          // Add lowercase versions of field names for consistent access
          Object.keys(item).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey !== key && !normalizedItem[lowerKey]) {
              normalizedItem[lowerKey] = item[key];
            }
          });
          
          // Ensure we have a 'name' field for charts
          if (!normalizedItem.name && !normalizedItem.NAME) {
            const nameFields = Object.keys(normalizedItem).filter(key => 
              typeof normalizedItem[key] === 'string' ||
              key.toLowerCase().includes('name') ||
              key.toLowerCase().includes('month') ||
              key.toLowerCase().includes('date')
            );
            if (nameFields.length > 0) {
              normalizedItem.name = normalizedItem[nameFields[0]];
            }
          }
          
          return normalizedItem;
        });

        return {
          type: mark || 'bar',
          data: transformedData,
          originalData,
          title: vegaSpec.title
        };
      }

      // Handle generic chart specifications
      if (chartSpec.type && chartSpec.data) {
        const originalData = chartSpec.data.map((item: any, index: number) => ({ 
          id: index, 
          ...item 
        }));
        return {
          type: chartSpec.type,
          data: chartSpec.data,
          originalData,
          title: chartSpec.title
        };
      }

      // Handle direct data arrays
      if (Array.isArray(chartSpec)) {
        const originalData = chartSpec.map((item: any, index: number) => ({ 
          id: index, 
          ...item 
        }));
        return {
          type: 'bar',
          data: chartSpec,
          originalData,
          title: 'Chart'
        };
      }

      // Fallback
      return {
        type: 'bar',
        data: [],
        originalData: [],
        title: 'No Data Available'
      };
    } catch (error) {
      return {
        type: 'bar',
        data: [],
        originalData: [],
        title: 'Chart Parse Error'
      };
    }
  };

  const { type, data, originalData, title } = useMemo(() => {
    return parseChartData(chartContent.chart_spec);
  }, [chartContent]);

  // Auto-detect fields for rendering
  const chartConfig = useMemo(() => {
    if (!data || data.length === 0) {
      return { xKey: '', yKeys: [] };
    }

    const dataKeys = Object.keys(data[0] || {});
    
    // Auto-detect X-axis field (temporal/categorical) - generic approach
    let xKey = dataKeys.find(key => 
      key.toLowerCase().includes('month') ||
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('timestamp') ||
      key.toLowerCase().includes('datetime') ||
      key.toLowerCase().includes('time_') ||
      key.toLowerCase().includes('_time') ||
      key.toLowerCase() === 'time' ||
      key.toLowerCase().includes('year') ||
      key.toLowerCase().includes('quarter') ||
      key.toLowerCase().includes('week') ||
      key.toLowerCase().includes('day') ||
      key === 'name' ||
      key.toLowerCase().includes('category') ||
      key.toLowerCase().includes('group') ||
      key.toLowerCase().includes('type') ||
      key.toLowerCase().includes('label') ||
      key.toLowerCase().includes('ticker') ||
      key.toLowerCase().includes('primary_ticker') ||
      (typeof data[0]?.[key] === 'string')
    );
    
    
    // Fallback to first string field or 'name'
    if (!xKey) {
      xKey = dataKeys.find(key => typeof data[0]?.[key] === 'string') || 'name';
    }

    // Auto-detect Y-axis fields (numeric values, excluding metadata)
    let yKeys = dataKeys.filter(key => {
      const isNotXKey = key !== xKey;
      const isNotName = key !== 'name';
      const isNotId = key !== 'id';
      const hasNoDate = !key.toLowerCase().includes('date');
      // Be more specific about time fields to avoid excluding "sentiment" fields
      const hasNoTime = !(
        key.toLowerCase().includes('timestamp') ||
        key.toLowerCase().includes('datetime') ||
        key.toLowerCase().includes('time_') ||
        key.toLowerCase().includes('_time') ||
        key.toLowerCase() === 'time'
      );
      const hasNoMonth = !key.toLowerCase().includes('month');
      const hasNoYear = !key.toLowerCase().includes('year');
      const isNumeric = typeof data[0]?.[key] === 'number' || !isNaN(Number(data[0]?.[key]));
      
      return isNotXKey && isNotName && isNotId && hasNoDate && hasNoTime && hasNoMonth && hasNoYear && isNumeric;
    });
    
    // Filter out metadata and system fields (generic patterns)
    // BUT preserve actual data fields like AVG_SENTIMENT_SCORE, MONTHLY_SALES, etc.
    const excludePatterns = [
      // Only exclude clearly administrative/metadata fields
      /^id$/i,
      /^name$/i,
      /^label$/i,
      /^key$/i,
      /timestamp/i,
      /created/i,
      /updated/i,
      /_id$/i,
      /_key$/i,
      // Exclude count_distinct but not other aggregates that might be data
      /count_distinct/i,
      /COUNT_DISTINCT/i
    ];

    yKeys = yKeys.filter(key => {
      return !excludePatterns.some(pattern => pattern.test(key));
    });

    // Remove case-insensitive duplicates
    const seen = new Set<string>();
    yKeys = yKeys.filter(key => {
      const lowerKey = key.toLowerCase();
      if (seen.has(lowerKey)) {
        return false;
      }
      seen.add(lowerKey);
      return true;
    });

    return { xKey, yKeys };
  }, [data]);

  // Enhanced tooltip formatter to match the reference image
  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [value.toLocaleString(), name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())];
    }
    return [value, name];
  };

  // Enhanced label formatter for tooltips
  const formatTooltipLabel = (label: string) => {
    if (label && typeof label === 'string') {
      // Convert date strings to readable format like "Month (2025) Jul"
      if (label.includes('-') && label.length >= 7) {
        try {
          const date = new Date(label);
          if (!isNaN(date.getTime())) {
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const year = date.getFullYear();
            return `Month (${year}) ${month}`;
          }
        } catch (e) {
          // Fall through to default formatting
        }
      }
    }
    return label;
  };

  // Generic tooltip formatter for any data type
  const customTooltipFormatter = (value: any, name: string) => {
    // Enhanced field name formatting
    let formattedName = name;
    
    // Replace underscores with spaces
    formattedName = formattedName.replace(/_/g, ' ');
    
    // Handle common patterns for better readability
    formattedName = formattedName
      .replace(/\bCOUNT\b/gi, 'Count')
      .replace(/\bREGISTRATION\b/gi, 'Registration')
      .replace(/\bTOTAL\b/gi, 'Total')
      .replace(/\bAVG\b/gi, 'Average')
      .replace(/\bSUM\b/gi, 'Sum')
      .replace(/\bMAX\b/gi, 'Maximum')
      .replace(/\bMIN\b/gi, 'Minimum');
    
    // Title case for remaining words
    formattedName = formattedName.replace(/\b\w/g, (l: string) => l.toUpperCase());
    
    if (typeof value === 'number') {
      return [value.toLocaleString(), formattedName];
    }
    return [value, formattedName];
  };

  // Generic label formatter for tooltips - handles dates, strings, etc.
  const customLabelFormatter = (label: string) => {
    if (label && typeof label === 'string') {
      // Try to parse as date
      if (label.includes('-') && label.length >= 7) {
        try {
          const date = new Date(label);
          if (!isNaN(date.getTime())) {
            // For monthly data
            if (label.includes('-01')) {
              const month = date.toLocaleDateString('en-US', { month: 'short' });
              const year = date.getFullYear();
              return `${month} ${year}`;
            }
            // For daily data
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          }
        } catch (e) {
          // Fall through to default formatting
        }
      }
      
      // Format category labels (e.g., "Person Industry Category")
      // Keep as-is if it's already in a readable format
      return label;
    }
    return label;
  };

  // Generate legend items for display above chart
  const renderLegendItems = () => {
    const { yKeys } = chartConfig;
    
    if (!yKeys || yKeys.length === 0) return null;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        mb: 2,
        pb: 1,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        {yKeys.map((key, index) => (
          <Box 
            key={key}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '3px',
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                flexShrink: 0
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'text.primary'
              }}
            >
              {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: height,
          color: 'text.secondary' 
        }}>
          <Typography variant="body1">No data available for visualization</Typography>
        </Box>
      );
    }

    const { xKey, yKeys } = chartConfig;

    switch (type) {
      case 'line':
        return (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={alpha(theme.palette.divider, 0.3)}
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey={xKey} 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={(value) => {
                  // Format month values for display
                  if (typeof value === 'string' && value.includes('-')) {
                    try {
                      const date = new Date(value);
                      if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }
                    } catch (e) {
                      // Fall through to default
                    }
                  }
                  return value;
                }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={11}
                tickFormatter={(value) => {
                  if (typeof value === 'number') {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toLocaleString();
                  }
                  return value;
                }}
                domain={['dataMin * 0.95', 'dataMax * 1.1']}
                width={70}
              />
              <Tooltip 
                formatter={customTooltipFormatter}
                labelFormatter={customLabelFormatter}
                contentStyle={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '4px',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
                  fontSize: '0.9rem',
                  padding: '8px 12px'
                }}
                labelStyle={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: theme.palette.text.primary
                }}
                itemStyle={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem'
                }}
                cursor={{ stroke: alpha(theme.palette.primary.main, 0.3), strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              {yKeys.map((key, index) => (
                <Line
                  key={key}
                  type="linear"
                  dataKey={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={3}
                  dot={{ 
                    fill: CHART_COLORS[index % CHART_COLORS.length], 
                    strokeWidth: 2, 
                    r: 5
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: CHART_COLORS[index % CHART_COLORS.length], 
                    strokeWidth: 3,
                    fill: '#ffffff'
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 60, bottom: 90 }}>
              <defs>
                {yKeys.map((key, index) => (
                  <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid 
                strokeDasharray="1 3" 
                stroke={alpha(theme.palette.divider, 0.2)} 
                strokeWidth={1}
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey={xKey} 
                stroke={theme.palette.text.secondary}
                fontSize={11}
                fontWeight={500}
                angle={-45}
                textAnchor="end"
                height={90}
                interval={0}
                axisLine={{ stroke: alpha(theme.palette.divider, 0.3), strokeWidth: 1 }}
                tickLine={{ stroke: alpha(theme.palette.divider, 0.3), strokeWidth: 1 }}
                tickFormatter={(value) => {
                  // Truncate long labels for better readability
                  if (typeof value === 'string' && value.length > 25) {
                    return value.substring(0, 22) + '...';
                  }
                  return value;
                }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={11}
                fontWeight={500}
                tickFormatter={(value) => {
                  if (typeof value === 'number') {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toLocaleString();
                  }
                  return value;
                }}
                axisLine={{ stroke: alpha(theme.palette.divider, 0.3), strokeWidth: 1 }}
                tickLine={{ stroke: alpha(theme.palette.divider, 0.3), strokeWidth: 1 }}
                width={70}
              />
              <Tooltip 
                formatter={customTooltipFormatter}
                labelFormatter={customLabelFormatter}
                contentStyle={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: '12px',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.12)',
                  fontSize: '0.875rem',
                  backdropFilter: 'blur(8px)',
                  padding: '12px 16px'
                }}
                labelStyle={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: '8px',
                  fontSize: '0.9rem'
                }}
                itemStyle={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                  padding: '2px 0'
                }}
                cursor={false}
              />
              {yKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`url(#barGradient-${index})`}
                  radius={[6, 6, 0, 0]}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={1}
                  strokeOpacity={0.8}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis 
                dataKey={xKey} 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  fontSize: '0.9rem'
                }}
                labelStyle={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem'
                }}
              />
              {yKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={alpha(CHART_COLORS[index % CHART_COLORS.length], 0.6)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'circle':
      case 'pie':
        // Transform data for pie chart
        const pieData = yKeys.length > 0 ? data.map((item, index) => ({
          name: item[xKey] || `Item ${index + 1}`,
          value: item[yKeys[0]] || 0
        })) : [];

        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  return `${name}: ${(percent * 100).toFixed(1)}%`;
                }}
                outerRadius={Math.min(height * 0.3, 120)}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : value, 'Value']}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  fontSize: '0.9rem'
                }}
                labelStyle={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'point':
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis 
                dataKey={xKey} 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  fontSize: '0.9rem'
                }}
                labelStyle={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem'
                }}
              />
              {yKeys.map((key, index) => (
                <Scatter
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        // Default to bar chart for unknown types
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis 
                dataKey={xKey} 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  fontSize: '0.9rem'
                }}
                labelStyle={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem'
                }}
              />
              {yKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // Render data table
  const renderTable = () => {
    if (!originalData || originalData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body1">No data available</Typography>
        </Box>
      );
    }

    const columns = Object.keys(originalData[0] || {}).filter(key => key !== 'id');

    return (
      <TableContainer sx={{ maxHeight: height - 100 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: theme.palette.background.default,
                    fontSize: '0.9rem'
                  }}
                >
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {originalData.map((row, index) => (
              <TableRow key={row.id || index} hover>
                {columns.map((column) => (
                  <TableCell 
                    key={column}
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {typeof row[column] === 'number' 
                      ? row[column].toLocaleString()
                      : row[column]?.toString() || '-'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title || 'Data Visualization'}
          </Typography>
        </Box>

        {/* Simple Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Chart" />
          <Tab label="Table" />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {activeTab === 0 ? (
          <>
            {renderLegendItems()}
            {renderChart()}
          </>
        ) : (
          renderTable()
        )}
      </Box>
    </Paper>
  );
};

export default ChartVisualization;
export { ChartVisualization };
