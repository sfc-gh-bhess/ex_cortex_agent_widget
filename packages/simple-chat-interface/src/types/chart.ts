/**
 * Chart types for Snowflake Cortex Agents visualization system
 * Based on the comprehensive chart data flow documentation
 */

// Vega-Lite specification interface
export interface VegaLiteSpec {
  $schema: string;
  title?: string;
  mark: string | { type: string; [key: string]: any };
  encoding: {
    x?: {
      field: string;
      title?: string;
      type: 'temporal' | 'nominal' | 'ordinal' | 'quantitative';
      sort?: any;
      axis?: { format?: string };
      timeUnit?: string;
    };
    y?: {
      field: string;
      title?: string;
      type: 'temporal' | 'nominal' | 'ordinal' | 'quantitative';
      sort?: any;
    };
    color?: {
      field: string;
      type: 'nominal' | 'ordinal' | 'quantitative';
      title?: string;
    };
  };
  data: {
    values: any[];
  };
  config?: any;
}

// Chart content structure that our components expect
export interface ChartContent {
  type: 'vega-lite' | 'generic' | 'direct';
  chart_spec: VegaLiteSpec | any; // Vega-Lite spec or generic chart spec
}

// Recharts-compatible data structure
export interface RechartsData {
  id?: number;
  name?: string;
  [key: string]: any;
}

// Chart parsing result
export interface ChartParseResult {
  type: string;
  data: RechartsData[];
  originalData: RechartsData[];
  title?: string;
  xKey?: string;
  yKeys?: string[];
}

// Chart visualization props
export interface ChartVisualizationProps {
  chartContent: ChartContent;
  height?: number;
  width?: number;
}

// Supported chart types for Recharts rendering
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'scatter';

// Snowflake-inspired professional color palette
export const CHART_COLORS = [
  '#29B5E8', // Snowflake primary blue
  '#1976D2', // Deep blue
  '#4CAF50', // Success green  
  '#FF9800', // Warning orange
  '#9C27B0', // Purple
  '#F44336', // Error red
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B'  // Blue grey
];

