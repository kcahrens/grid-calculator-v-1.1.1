import React, { useState } from 'react';

function GridCalculator() {
  // State for inputs
  const [baseRate, setBaseRate] = useState('100'); // Base rate as string to allow empty input
  const [multiplier, setMultiplier] = useState('10'); // Multiplier as string to allow empty input
  const [capEnabled, setCapEnabled] = useState(false); // Cap switch, off by default
  const [capValue, setCapValue] = useState(''); // Cap value as string to allow empty input

  // Generate hour rates (1.0 to 20.0)
  const hourRates = Array.from({ length: 20 }, (_, i) => i + 1);

  // Generate increments (0.0 to 0.9 in steps of 0.1)
  const increments = Array.from({ length: 10 }, (_, i) => i * 0.1);

  // Function to calculate cell values with cap logic
  const calculateValue = (hourRate, increment) => {
    const numBaseRate = Number(baseRate) || 0; // Convert to number, empty becomes 0
    const numMultiplier = Number(multiplier) || 0; // Convert to number, empty becomes 0

    // Determine the effective hour rate for the adjustment calculation
    let effectiveHourRate = hourRate;
    if (capEnabled && capValue !== '') {
      const cap = Math.floor(Number(capValue)); // Ensure cap is a whole number
      if (cap > 0) {
        effectiveHourRate = Math.min(hourRate, cap); // Cap the hour rate if exceeded
      }
    }

    // Calculate adjustment: 0 if hourRate is 1 or multiplier is 0, otherwise scale by effective hour rate
    const adjustment =
      hourRate === 1 || numMultiplier === 0
        ? 0
        : (effectiveHourRate * (numMultiplier / 10)) + increment;

    // Final cell value
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
          onChange={(e) => setBaseRate(e.target.value)}
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* Multiplier Input */}
      <div style={{ marginBottom: '10px' }}>
        <label>Multiplier: </label>
        <input
          type="number"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          style={{ marginLeft: '5px' }}
        />
      </div>

      {/* Cap Matrix Switch */}
      <div style={{ marginBottom: '10px' }}>
        <label>
          <input
            type="checkbox"
            checked={capEnabled}
            onChange={(e) => setCapEnabled(e.target.checked)}
          />
          Cap matrix
        </label>
      </div>

      {/* Cap Value Input (shown only when cap is enabled) */}
      {capEnabled && (
        <div style={{ marginBottom: '20px' }}>
          <label>Cap value: </label>
          <input
            type="number"
            value={capValue}
            onChange={(e) => setCapValue(e.target.value)}
            step="1" // Allows only whole numbers in UI
            min="0" // Prevents negative numbers
            style={{ marginLeft: '5px' }}
          />
        </div>
      )}

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