// src/components/Graph.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, showDollarAmount, baseRate, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Get the data point
    const firstLineValue = showDollarAmount ? data.totalAmount : data.elr;
    const secondLineValue = showDollarAmount ? (data.hours * baseRate) : baseRate;
    const difference = firstLineValue - secondLineValue;

    // Format values based on the view
    const formatValue = (value) => {
      return showDollarAmount ? `$${Math.round(value)}` : `$${Math.round(value)}/hr`;
    };

    const formatDifference = (diff) => {
      return showDollarAmount ? `$${Math.round(diff)}` : `$${Math.round(diff)}/hr`;
    };

    return (
      <div style={{
        backgroundColor: theme === 'light' ? '#ffffff' : '#25292b',
        color: theme === 'light' ? '#1c2526' : '#e6ecef',
        border: `1px solid ${theme === 'light' ? '#d1d9e0' : '#3a4043'}`,
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}>
        <p>{`Hours: ${label.toFixed(1)}`}</p>
        <p>{`${showDollarAmount ? 'Matrix Amount' : 'Calculated ELR'}: ${formatValue(firstLineValue)}`}</p>
        <p>{`${showDollarAmount ? 'Standard Amount' : 'Base Rate'}: ${formatValue(secondLineValue)}`}</p>
        <p>{`Difference: ${formatDifference(difference)}`}</p>
      </div>
    );
  }
  return null;
};

const Graph = ({ data, baseRate, showDollarAmount, theme }) => {
  const numBaseRate = Number(baseRate) || 0;

  // Calculate min and max for Y-axis based on showDollarAmount
  const minELR = Math.min(...data.map(item => item.elr));
  const maxELR = Math.max(...data.map(item => item.elr));
  const minTotalAmount = Math.min(...data.map(item => item.totalAmount));
  const maxTotalAmount = Math.max(...data.map(item => item.totalAmount));
  const minStandardAmount = data[0].hours * numBaseRate;
  const maxStandardAmount = data[data.length - 1].hours * numBaseRate;

  const minPlottedELR = Math.min(minELR, numBaseRate);
  const maxPlottedELR = Math.max(maxELR, numBaseRate);
  const minPlottedDollar = Math.min(minTotalAmount, minStandardAmount);
  const maxPlottedDollar = Math.max(maxTotalAmount, maxStandardAmount);

  // Add 10% padding to min and max
  const yMin = showDollarAmount
    ? Math.floor(minPlottedDollar * 0.9)
    : Math.max(Math.floor(minPlottedELR * 0.9), 0);
  const yMax = showDollarAmount
    ? Math.ceil(maxPlottedDollar * 1.1)
    : Math.ceil(maxPlottedELR * 1.1);

  // Define X-axis ticks every 2.5 hours
  const xTicks = Array.from({ length: 8 }, (_, i) => 1.0 + i * 2.5).concat(20.0);

  return (
    <ResponsiveContainer width="100%" height={600}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={true}
          horizontal={true}
        />
        <XAxis 
          dataKey="hours" 
          label={{ value: 'Hours', position: 'insideBottomRight', offset: -5 }} 
          type="number"
          domain={[1, 20]}
          ticks={xTicks}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <YAxis 
          label={{ value: showDollarAmount ? 'Total Amount ($)' : 'ELR', angle: -90, position: 'insideLeft' }} 
          type="number"
          domain={[yMin, yMax]}
          tickCount={10}
          tickFormatter={(value) => Math.round(value)}
        />
        <RechartsTooltip 
          content={<CustomTooltip showDollarAmount={showDollarAmount} baseRate={numBaseRate} theme={theme} />}
        />
        <Line
          type="monotone"
          dataKey={showDollarAmount ? 'totalAmount' : 'elr'}
          stroke="#8884d8"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          name={showDollarAmount ? 'Matrix Amount' : 'Calculated ELR'}
        />
        <Line
          type="monotone"
          dataKey={(entry) => showDollarAmount ? entry.hours * numBaseRate : numBaseRate}
          stroke="#ff7300"
          strokeWidth={2}
          dot={false}
          name={showDollarAmount ? 'Standard Amount' : 'Base Rate'}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Graph;