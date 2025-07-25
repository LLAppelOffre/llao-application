import { ResponsiveBar, BarSvgProps } from '@nivo/bar';
import React from 'react';

export interface BarDatum {
  [key: string]: string | number;
}

interface NivoBarChartProps {
  data: BarDatum[];
  keys: string[];
  indexBy: string;
  height?: number;
  colors?: string[];
  margin?: BarSvgProps<BarDatum>['margin'];
  axisBottom?: BarSvgProps<BarDatum>['axisBottom'];
  axisLeft?: BarSvgProps<BarDatum>['axisLeft'];
  legends?: BarSvgProps<BarDatum>['legends'];
  themeOverrides?: any;
  groupMode?: BarSvgProps<BarDatum>['groupMode'];
  layout?: BarSvgProps<BarDatum>['layout'];
  axisBottomLegend?: string;
  axisLeftLegend?: string;
  legendLabel?: string;
  xAxisTickRotation?: number;
}

const NivoBarChart: React.FC<NivoBarChartProps> = ({
  data,
  keys,
  indexBy,
  height = 350,
  colors = ['#37966F', '#A5D6A7', '#4A635D', '#F4B084', '#D32F2F', '#4472C4', '#70AD47'],
  margin = { top: 40, right: 40, bottom: 50, left: 60 },
  axisBottom,
  axisLeft,
  legends,
  themeOverrides = {},
  groupMode = 'grouped',
  layout = 'vertical',
  axisBottomLegend,
  axisLeftLegend,
  legendLabel,
  xAxisTickRotation,
}) => {
  const nivoTheme = {
    background: 'transparent',
    textColor: '#1A1A1A', // Texte principal LL'AO
    fontFamily: "'IBM Plex Sans', Arial, sans-serif",
    fontSize: 14,
    axis: {
      domain: {
        line: {
          stroke: '#D0E8DA', // border color
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: '#D0E8DA',
          strokeWidth: 1,
        },
        text: {
          fill: '#4A635D', // textSecondary
        },
      },
      legend: {
        text: {
          fill: '#1A1A1A', // text
          fontWeight: 'bold',
        },
      },
    },
    grid: {
      line: {
        stroke: '#E8F5E9', // backgroundSecondary
        strokeWidth: 1,
      },
    },
    legends: {
      text: {
        fill: '#1A1A1A', // text
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
  // Axis config
  const axisBottomFinal = axisBottom ?? {
    tickRotation: xAxisTickRotation ?? 0,
    legend: axisBottomLegend,
    legendPosition: 'middle',
    legendOffset: 36,
  };
  const axisLeftFinal = axisLeft ?? {
    legend: axisLeftLegend,
    legendPosition: 'middle',
    legendOffset: -48,
  };
  // Legend config
  const legendsFinal = legends ?? (legendLabel
    ? [
        {
          dataFrom: 'keys',
          anchor: 'top-right',
          direction: 'column',
          justify: false,
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: 20,
          symbolSize: 20,
          symbolShape: 'circle',
          effects: [
            {
              on: 'hover',
              style: {
                itemTextColor: '#37966F', // primary color
              },
            },
          ],
        },
      ]
    : undefined);
  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={margin}
        colors={colors}
        axisBottom={axisBottomFinal}
        axisLeft={axisLeftFinal}
        legends={legendsFinal}
        theme={nivoTheme}
        groupMode={groupMode}
        layout={layout}
        animate={true}
        motionConfig="wobbly"
        enableLabel={false}
        padding={0.3}
      />
    </div>
  );
};

export default NivoBarChart; 