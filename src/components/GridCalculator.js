// src/components/GridCalculator.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { RiSunLine, RiMoonLine, RiLineChartLine, RiExchangeDollarLine } from 'react-icons/ri';
import Graph from './Graph';

// Define themes
const lightTheme = {
  background: '#f5f7fa',
  cardBg: '#ffffff',
  text: '#1c2526',
  border: '#d1d9e0',
  accent: '#007aff',
  headerBg: '#eef2f5',
  tooltipBg: '#ffffff',
  tooltipText: '#1c2526',
};

const darkTheme = {
  background: '#171a1c',
  cardBg: '#25292b',
  text: '#e6ecef',
  border: '#3a4043',
  accent: '#0a84ff',
  headerBg: '#1f2224',
  tooltipBg: '#25292b',
  tooltipText: '#e6ecef',
};

// Styled components
const AppContainer = styled.div`
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  position: relative;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-align: center;
  @media (max-width: 600px) {
    font-size: 28px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: ${({ theme }) => theme.text};
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 1200px;
  width: 100%;
`;

const InputsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
  align-items: flex-start;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

const LeftInputs = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

const RightInputs = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: flex-start;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 120px;
`;

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 120px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const Input = styled.input`
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  width: 100px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  @media (max-width: 600px) {
    width: 150px;
  }
`;

const ToggleWrapper = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  &:checked + span {
    background-color: ${({ theme }) => theme.accent};
  }
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.border};
  border-radius: 24px;
  &:before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: ${({ theme }) => theme.text};
    border-radius: 50%;
    transition: transform 0.3s ease;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
`;

const Th = styled.th`
  background-color: ${({ theme }) => theme.headerBg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 14px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`;

const Td = styled.td`
  background-color: ${({ isFirstColumn, theme }) =>
    isFirstColumn ? theme.headerBg : theme.cardBg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 14px;
  text-align: center;
  font-size: 14px;
  font-weight: ${({ isFirstColumn }) => (isFirstColumn ? '700' : '400')};
  color: ${({ theme }) => theme.text};
`;

const Tooltip = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -100%);
  top: ${({ y }) => y}px;
  left: ${({ x }) => x}px;
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
`;

function GridCalculator() {
  const [baseRate, setBaseRate] = useState('100');
  const [multiplier, setMultiplier] = useState('10');
  const [capEnabled, setCapEnabled] = useState(false);
  const [capValue, setCapValue] = useState('');
  const [theme, setTheme] = useState('light');
  const [showGraph, setShowGraph] = useState(false);
  const [showDollarAmount, setShowDollarAmount] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const hourRates = Array.from({ length: 21 }, (_, i) => i);
  const increments = Array.from({ length: 10 }, (_, i) => i * 0.1);

  const calculateValue = (hourRate, increment, isCapCalculation = false) => {
    const numBaseRate = Number(baseRate) || 0;
    const numMultiplier = Number(multiplier) || 0;
    const totalHours = hourRate + increment;

    if (hourRate === 0) {
      return totalHours * numBaseRate;
    }

    let effectiveHourRate = hourRate;
    let adjustment =
      hourRate === 1 || numMultiplier === 0
        ? 0
        : (effectiveHourRate * (numMultiplier / 10)) + increment;
    let value = totalHours * (numBaseRate + adjustment);

    if (!isCapCalculation && capEnabled && capValue !== '') {
      const cap = Math.floor(Number(capValue));
      if (cap > 0 && totalHours >= cap) {
        const capValueAtLimit = calculateValue(cap, 0, true);
        const cappedELR = capValueAtLimit / cap;
        value = totalHours * cappedELR;
      }
    }

    return value;
  };

  const generateGraphData = () => {
    const data = [];
    hourRates.forEach((hourRate) => {
      increments.forEach((inc) => {
        const totalHours = hourRate + inc;
        if (totalHours >= 1.0) {
          const totalAmount = calculateValue(hourRate, inc);
          const elr = totalHours > 0 ? parseFloat((totalAmount / totalHours).toFixed(2)) : 0;
          data.push({ hours: totalHours, elr, totalAmount });
        }
      });
    });
    return data.sort((a, b) => a.hours - b.hours);
  };

  const graphData = useMemo(() => generateGraphData(), [baseRate, multiplier, capEnabled, capValue]);

  const handleMouseEnter = (e, hourRate, increment) => {
    const totalAmount = calculateValue(hourRate, increment);
    const totalHours = hourRate + increment;
    let elr;
    if (totalHours === 0) {
      elr = 'N/A';
    } else {
      elr = (totalAmount / totalHours).toFixed(2);
    }
    const rect = e.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top - 10 + scrollTop,
      content: `ELR: $${elr}/hr`,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  };

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <AppContainer>
        <Header>
          <Title>Labor Rate Matrix</Title>
          <ButtonGroup>
            {showGraph && (
              <IconButton onClick={() => setShowDollarAmount(!showDollarAmount)}>
                <RiExchangeDollarLine size={24} />
              </IconButton>
            )}
            <IconButton onClick={() => setShowGraph(!showGraph)}>
              <RiLineChartLine size={24} />
            </IconButton>
            <IconButton onClick={toggleTheme}>
              {theme === 'light' ? <RiSunLine size={24} /> : <RiMoonLine size={24} />}
            </IconButton>
          </ButtonGroup>
        </Header>
        <Card>
          <InputsContainer>
            <LeftInputs>
              <InputWrapper>
                <Label>Base Rate</Label>
                <Input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                />
              </InputWrapper>
              <InputWrapper>
                <Label>Multiplier</Label>
                <Input
                  type="number"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                />
              </InputWrapper>
            </LeftInputs>
            <RightInputs>
              {capEnabled && (
                <InputWrapper>
                  <Label>Cap Hour</Label>
                  <Input
                    type="number"
                    value={capValue}
                    onChange={(e) => setCapValue(e.target.value)}
                    step="1"
                    min="0"
                  />
                </InputWrapper>
              )}
              <ToggleContainer>
                <Label>Cap Matrix</Label>
                <ToggleWrapper>
                  <ToggleInput
                    type="checkbox"
                    checked={capEnabled}
                    onChange={(e) => setCapEnabled(e.target.checked)}
                  />
                  <ToggleSlider />
                </ToggleWrapper>
              </ToggleContainer>
            </RightInputs>
          </InputsContainer>
          {showGraph ? (
            <Graph data={graphData} baseRate={baseRate} showDollarAmount={showDollarAmount} theme={theme} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Labor Time</Th>
                  {increments.map((inc) => (
                    <Th key={inc}>{inc.toFixed(1)}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hourRates.map((hourRate) => (
                  <tr key={hourRate}>
                    <Td isFirstColumn>{hourRate.toFixed(1)}</Td>
                    {increments.map((inc) => (
                      <Td
                        key={inc}
                        onMouseEnter={(e) => handleMouseEnter(e, hourRate, inc)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {calculateValue(hourRate, inc).toFixed(2)}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        {!showGraph && (
          <Tooltip show={tooltip.show} x={tooltip.x} y={tooltip.y}>
            {tooltip.content}
          </Tooltip>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default GridCalculator;