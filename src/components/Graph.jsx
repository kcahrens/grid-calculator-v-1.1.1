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
const CustomTooltip = ({ active, payload, label, baseRate, theme, calculateValue }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = data.hours;
    const matrixLabor = calculateValue(hours, { baseRate: baseRate.toString(), multiplier: '1.02', mode: 'infinity', peakHours: '', q: '15', inputHours: '' });
    const baseRateLabor = hours * baseRate;
    const laborDifference = matrixLabor - baseRateLabor;
    const matrixELR = hours > 0 ? matrixLabor / hours : 0; // Recalculate to match grid
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
        <p>{`Hours: ${label.toFixed(1)}`}</p>
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

  // CalculateValue function to match grid logic
  const calculateValue = (totalHours, config = { baseRate: '150', multiplier: '1.02', mode: 'infinity', peakHours: '', q: '15', inputHours: '' }) => {
    const { baseRate, multiplier, mode, peakHours, q } = config;
    const numBaseRate = Number(baseRate) || 0;
    const numMultiplier = Number(multiplier) || 1;
    const numPeakHours = peakHours ? Number(peakHours) : Infinity;
    const numQ = Number(q) || 0;

    if (totalHours <= 0) return 0;

    const k = Math.round(totalHours * 10);
    let cellsPastOne = Math.max(0, k - 10);

    let scalingFactor = 1;

    if (mode === 'infinity' || (mode === 'hoursCap' && !peakHours)) {
      scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
    } else if (mode === 'hoursCap' && peakHours) {
      const peakCells = Math.round(numPeakHours * 10) - 10;
      cellsPastOne = Math.min(cellsPastOne, peakCells);
      scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
    } else if (mode === 'mirror') {
      const peakCells = Math.round(numPeakHours * 10) - 10;
      if (totalHours <= numPeakHours) {
        scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
      } else {
        const cellsPastPeak = k - Math.round(numPeakHours * 10);
        const mirroredCells = peakCells - cellsPastPeak;
        cellsPastOne = Math.max(0, mirroredCells);
        scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
      }
    } else if (mode === 'proportional') {
      if (totalHours <= numPeakHours) {
        scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
      } else if (totalHours <= numQ && numQ > numPeakHours) {
        const peakCells = Math.round(numPeakHours * 10) - 10;
        const peakScalingFactor = 1 + (numMultiplier - 1) * peakCells;
        const decreaseFactor = (totalHours - numPeakHours) / (numQ - numPeakHours);
        scalingFactor = peakScalingFactor - (peakScalingFactor - 1) * decreaseFactor;
      } else {
        scalingFactor = 1;
      }
    }

    let totalAmount = numBaseRate * scalingFactor * totalHours;

    if (mode === 'hoursCap' && peakHours && totalHours > numPeakHours) {
      const peakCells = Math.round(numPeakHours * 10) - 10;
      const peakScalingFactor = 1 + (numMultiplier - 1) * peakCells;
      const peakAmount = numBaseRate * peakScalingFactor * numPeakHours;
      totalAmount = peakAmount + (totalHours - numPeakHours) * numBaseRate * peakScalingFactor;
    }

    return Number(totalAmount.toFixed(2));
  };

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

  // Set Y-axis min and max
  const yMin = showDollarAmount
    ? Math.floor(minPlottedDollar * 0.9) // Dollar graph: 90% of min plotted value
    : Math.max(0, Math.floor(numBaseRate - 50)); // ELR graph: 50 below base rate, not below 0 (for all modes)
  const yMax = showDollarAmount
    ? Math.ceil(maxPlottedDollar * 1.1) // Dollar graph: 110% of max plotted value
    : Math.ceil(maxPlottedELR * 1.1); // ELR graph: 110% of max ELR

  // Define X-axis ticks
  const xTicks = [0.5, 2.5, 5.0, 10.0, 15.0, 20.0];

  return (
    <ResponsiveContainer width="100%" height={600}>
      <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
        <XAxis
          dataKey="hours"
          label={{ value: 'Hours', position: 'insideBottomRight', offset: -5 }}
          type="number"
          domain={[0.5, 20.0]}
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
        <RechartsTooltip content={<CustomTooltip baseRate={numBaseRate} theme={theme} calculateValue={calculateValue} />} />
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