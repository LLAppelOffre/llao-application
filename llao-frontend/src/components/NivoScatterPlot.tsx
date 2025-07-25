import { ResponsiveScatterPlot, ScatterPlotSvgProps } from '@nivo/scatterplot';
import React from 'react';
import type { ScatterPlotDatum } from '@nivo/scatterplot';

export interface ScatterSerie {
  id: string;
  data: { x: number; y: number }[];
}

interface NivoScatterPlotProps {
  data: ScatterSerie[];
  height?: number;
  colors?: string[];
  margin?: ScatterPlotSvgProps<ScatterPlotDatum>['margin'];
  axisBottomLegend?: string;
  axisLeftLegend?: string;
  themeOverrides?: any;
}

const NivoScatterPlot: React.FC<NivoScatterPlotProps> = ({
  data,
  height = 350,
  colors = ['#37966F', '#D32F2F', '#00B050'],
  margin = { top: 40, right: 40, bottom: 50, left: 60 },
  axisBottomLegend,
  axisLeftLegend,
  themeOverrides = {},
}) => {
  const nivoTheme = {
    background: 'transparent',
    textColor: '#1A1A1A',
    fontFamily: "'IBM Plex Sans', Arial, sans-serif",
    fontSize: 14,
    axis: {
      domain: {
        line: {
          stroke: '#D0E8DA',
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: '#D0E8DA',
          strokeWidth: 1,
        },
        text: {
          fill: '#4A635D',
        },
      },
      legend: {
        text: {
          fill: '#1A1A1A',
          fontWeight: 'bold',
        },
      },
    },
    grid: {
      line: {
        stroke: '#E8F5E9',
        strokeWidth: 1,
      },
    },
    tooltip: {
      container: {
        background: '#FFFFFF',
        color: '#1A1A1A',
        border: '1px solid #D0E8DA',
      },
    },
    ...themeOverrides,
  };
  return (
    <div style={{ height }}>
      <ResponsiveScatterPlot
        data={data}
        margin={margin}
        colors={colors}
        theme={nivoTheme}
        axisBottom={{
          legend: axisBottomLegend,
          legendPosition: 'middle',
          legendOffset: 36,
        }}
        axisLeft={{
          legend: axisLeftLegend,
          legendPosition: 'middle',
          legendOffset: -48,
        }}
        enableGridY={true}
        enableGridX={true}
        animate={true}
        motionConfig="wobbly"
        nodeSize={10}
        blendMode="multiply"
        useMesh={true}
      />
    </div>
  );
};

export default NivoScatterPlot; 