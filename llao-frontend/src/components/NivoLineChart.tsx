import { ResponsiveLine, LineSvgProps } from '@nivo/line';
import React from 'react';

export interface LineDatum {
  id: string;
  data: { x: string | number; y: number }[];
}

interface NivoLineChartProps {
  data: LineDatum[];
  height?: number;
  colors?: string[];
  margin?: LineSvgProps<LineDatum>['margin'];
  axisBottom?: LineSvgProps<LineDatum>['axisBottom'];
  axisLeft?: LineSvgProps<LineDatum>['axisLeft'];
  legends?: LineSvgProps<LineDatum>['legends'];
  themeOverrides?: any;
}

const NivoLineChart: React.FC<NivoLineChartProps> = ({
  data,
  height = 350,
  colors = ['#37966F', '#A5D6A7', '#4A635D', '#F4B084', '#D32F2F', '#4472C4', '#70AD47'],
  margin = { top: 40, right: 40, bottom: 50, left: 60 },
  axisBottom,
  axisLeft,
  legends,
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
    legends: {
      text: {
        fill: '#1A1A1A',
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
      <ResponsiveLine
        data={data}
        margin={margin}
        colors={colors}
        axisBottom={axisBottom}
        axisLeft={axisLeft}
        legends={legends}
        theme={nivoTheme}
        animate={true}
        motionConfig="wobbly"
        enablePoints={true}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        enableSlices="x"
        useMesh={true}
      />
    </div>
  );
};

export default NivoLineChart; 