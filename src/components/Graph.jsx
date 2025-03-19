import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Custom Active Dot Component for Copy Functionality
const CustomActiveDot = (props) => {
  const { cx, cy, payload, onCopyValue } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#8884d8"
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={() => onCopyValue(payload.totalAmount.toFixed(2))}
    />
  );
};

// Custom Tooltip Component with Full Details
const CustomTooltip = ({ active, payload, label, baseRate, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = data.hours;
    const matrixLabor = data.totalAmount; // Use precomputed value from graphData
    const baseRateLabor = hours * baseRate;
    const laborDifference = matrixLabor - baseRateLabor;
    const matrixELR = data.elr; // Use precomputed ELR from graphData
    const baseELR = baseRate;
    const elrDifference = matrixELR - baseELR;

    const formatDollar = (value) => `$${value.toFixed(2)}`;
    const formatELR = (value) => `$${value.toFixed(2)}/hr`;

    return (
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#25292b',
          color: theme === 'light' ? '#1c2526' : '#e6ecef',
          border: `1px solid ${theme === 'light' ? '#d1d9e0' : '#3a4043'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p>{`Hours: ${hours.toFixed(1)}`}</p>
        <p>{`Matrix Labor: ${formatDollar(matrixLabor)}`}</p>
        <p>{`Base Rate Labor: ${formatDollar(baseRateLabor)}`}</p>
        <p>{`Difference: ${formatDollar(laborDifference)}`}</p>
        <p>{`Matrix ELR: ${formatELR(matrixELR)}`}</p>
        <p>{`Base ELR: ${formatELR(baseELR)}`}</p>
        <p>{`Difference: ${formatELR(elrDifference)}`}</p>
      </div>
    );
  }
  return null;
};

const Graph = ({ data, baseRate, showDollarAmount, theme, onCopyValue }) => {
  const numBaseRate = Number(baseRate) || 0;

  // Filter data to include only points where 0.5 <= hours <= 20.0
  const filteredData = data.filter(item => item.hours >= 0.5 && item.hours <= 20.0);

  // Calculate min and max for Y-axis based on filtered data
  const minELR = Math.min(...filteredData.map((item) => item.elr));
  const maxELR = Math.max(...filteredData.map((item) => item.elr));
  const minTotalAmount = Math.min(...filteredData.map((item) => item.totalAmount));
  const maxTotalAmount = Math.max(...filteredData.map((item) => item.totalAmount));
  const minStandardAmount = Math.min(...filteredData.map((item) => item.hours * numBaseRate));
  const maxStandardAmount = Math.max(...filteredData.map((item) => item.hours * numBaseRate));

  const minPlottedELR = Math.min(minELR, numBaseRate);
  const maxPlottedELR = Math.max(maxELR, numBaseRate);
  const minPlottedDollar = Math.min(minTotalAmount, minStandardAmount);
  const maxPlottedDollar = Math.max(maxTotalAmount, maxStandardAmount);

  // Set Y-axis min and max with rounding to multiples
  const yMin = showDollarAmount
    ? Math.floor((minPlottedDollar * 0.9) / 10) * 10
    : Math.max(0, Math.floor((numBaseRate - 50) / 5) * 5);
  const yMax = showDollarAmount
    ? Math.ceil((maxPlottedDollar * 1.1) / 10) * 10
    : Math.ceil((maxPlottedELR * 1.1) / 5) * 5;

  // Generate Y-axis ticks
  const generateTicks = (min, max, step) => {
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    let current = start;
    while (current <= max) {
      ticks.push(current);
      current += step;
    }
    return ticks;
  };

  const yTicks = showDollarAmount
    ? generateTicks(yMin, yMax, 10)
    : generateTicks(yMin, yMax, 5);

  // Define X-axis ticks
  const xTicks = [0.5, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0];

  return (
    <ResponsiveContainer width="100%" height={600}>
      <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
        <XAxis
          dataKey="hours"
          label={{ value: 'Hours', position: 'insideBottom', offset: -10 }}
          type="number"
          domain={[0.5, 20.0]}
          ticks={xTicks}
          tickFormatter={(value) => value.toFixed(1)}
          interval={0}
        />
        <YAxis
          label={{ value: showDollarAmount ? 'Total Amount ($)' : 'ELR', angle: -90, position: 'left', offset: 10 }}
          type="number"
          domain={[yMin, yMax]}
          ticks={yTicks}
          tickFormatter={(value) => value.toFixed(0)}
        />
        <RechartsTooltip content={<CustomTooltip baseRate={numBaseRate} theme={theme} />} offset={15} />
        {/* Purple matrix line - rendered first to appear behind */}
        <Line
          type="monotone"
          dataKey={showDollarAmount ? 'totalAmount' : 'elr'}
          stroke="#8884d8"
          strokeWidth={3}
          dot={false}
          activeDot={<CustomActiveDot onCopyValue={onCopyValue} />}
          name={showDollarAmount ? 'Matrix Amount' : 'Calculated ELR'}
        />
        {/* Red base rate line - rendered second to appear on top */}
        <Line
          type="monotone"
          dataKey={(entry) => (showDollarAmount ? entry.hours * numBaseRate : numBaseRate)}
          stroke="#ff7300"
          strokeWidth={1}  // Thinner line
          strokeDasharray="5 5"  // Dashed line
          dot={false}
          name={showDollarAmount ? 'Standard Amount' : 'Base Rate'}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Graph;