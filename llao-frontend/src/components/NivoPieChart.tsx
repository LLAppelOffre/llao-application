import { ResponsivePie, PieSvgProps } from '@nivo/pie';
import React from 'react';

// Définition du type de données pour Nivo Pie
export interface PieDatum {
  id: string;
  value: number;
  label?: string;
}

interface NivoPieChartProps {
  data: PieDatum[];
  height?: number;
  colors?: string[];
  margin?: PieSvgProps<PieDatum>['margin'];
  innerRadius?: number;
  padAngle?: number;
  cornerRadius?: number;
  themeOverrides?: any;
  legends?: PieSvgProps<PieDatum>['legends'];
}

const NivoPieChart: React.FC<NivoPieChartProps> = ({
  data,
  height = 350,
  colors = ['#00B050', '#D32F2F', '#F4B084', '#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'],
  margin = { top: 40, right: 40, bottom: 50, left: 40 },
  innerRadius = 0.5,
  padAngle = 0.7,
  cornerRadius = 3,
  themeOverrides = {},
  legends,
}) => {
  // Application stricte de la charte graphique LL'AO
  const nivoTheme = {
    background: 'transparent',
    textColor: '#1A1A1A', // Texte principal LL'AO
    fontFamily: 'IBM Plex Sans, Arial, sans-serif',
    fontSize: 16,
    ...themeOverrides,
  };
  return (
    <div style={{ height }}>
      <ResponsivePie
        data={data}
        margin={margin}
        innerRadius={innerRadius}
        padAngle={padAngle}
        cornerRadius={cornerRadius}
        colors={colors}
        theme={nivoTheme}
        enableArcLabels={true}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        enableArcLinkLabels={true}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#1A1A1A"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        legends={legends}
        animate={true}
        motionConfig="wobbly"
      />
    </div>
  );
};

export default NivoPieChart; 