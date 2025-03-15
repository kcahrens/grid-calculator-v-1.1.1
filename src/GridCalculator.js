import React, { useState } from 'react';

function GridCalculator() {
  // State for base rate and multiplier as strings
  const [baseRate, setBaseRate] = useState('100');
  const [multiplier, setMultiplier] = useState('10');

  // Generate hour rates (1.0 to 20.0)
  const hourRates = Array.from({ length: 20 }, (_, i) => i + 1);

  // Generate increments (0.0 to 0.9 in steps of 0.1)
  const increments = Array.from({ length: 10 }, (_, i) => i * 0.1);

  // Function to calculate cell values based on the formula
  const calculateValue = (hourRate, increment) => {
    const numBaseRate = Number(baseRate); // Convert string to number, '' becomes 0
    const numMultiplier = Number(multiplier); // Convert string to number, '' becomes 0
    const adjustment =
      hourRate === 1 || numMultiplier === 0
        ? 0
        : (hourRate * (numMultiplier / 10)) + increment;
    return (hourRate + increment) * (numBaseRate + adjustment);
  };

  return (
    <div>
      {/* Base Rate Input */}
      <div style={{ marginBottom: '10px' }}>
        <label>Base Rate: </label>
        <input
          type="number"
          value={baseRate}
          onChange={(e) => setBaseRate(e.target.value)} // Set state to string value
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* Multiplier Input */}
      <div style={{ marginBottom: '20px' }}>
        <label>Multiplier: </label>
        <input
          type="number"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)} // Set state to string value
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* Grid Table */}
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '5px' }}>
              Hour Rate
            </th>
            {increments.map((inc) => (
              <th
                key={inc}
                style={{ border: '1px solid black', padding: '5px' }}
              >
                {inc.toFixed(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hourRates.map((hourRate) => (
            <tr key={hourRate}>
              <td style={{ border: '1px solid black', padding: '5px' }}>
                {hourRate.toFixed(1)}
              </td>
              {increments.map((inc) => (
                <td
                  key={inc}
                  style={{ border: '1px solid black', padding: '5px' }}
                >
                  {calculateValue(hourRate, inc).toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GridCalculator;