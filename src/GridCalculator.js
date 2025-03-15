import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { RiSunLine, RiMoonLine } from 'react-icons/ri';

// Define themes
const lightTheme = {
  background: '#f5f7fa',
  cardBg: '#ffffff',
  text: '#1c2526',
  border: '#d1d9e0',
  accent: '#007aff',
  headerBg: '#eef2f5',
};

const darkTheme = {
  background: '#171a1c',
  cardBg: '#25292b',
  text: '#e6ecef',
  border: '#3a4043',
  accent: '#0a84ff',
  headerBg: '#1f2224',
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

const Card = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 30px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  line-height: 1.2;
`;

const InputsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 20px 20px;
  align-items: start;
`;

const InputGroup = styled.div`
  display: contents;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const Input = styled.input`
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  width: 100px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
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
  transition: background-color 0.3s ease;

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

const TableContainer = styled.div`
  overflow-x: auto;
  margin-top: 20px;
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
  font-weight: ${({ isFirstRow }) => (isFirstRow ? '700' : '600')};
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

  &:hover {
    background-color: ${({ theme, isFirstColumn }) =>
      isFirstColumn
        ? theme.headerBg
        : theme === lightTheme
        ? '#f0f0f0'
        : '#303436'};
  }
`;

const ThemeToggleButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
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
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: ''
  });

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const hourRates = Array.from({ length: 20 }, (_, i) => i + 1);
  const increments = Array.from({ length: 10 }, (_, i) => i * 0.1);

  const calculateValue = (hourRate, increment) => {
    const numBaseRate = Number(baseRate) || 0;
    const numMultiplier = Number(multiplier) || 0;
    const cap = capEnabled && capValue !== '' ? Math.floor(Number(capValue)) : 0;

    const totalHours = hourRate + increment;

    if (cap > 0 && hourRate > cap) {
      // Compute adjustment and ELR at cap
      const capAdjustment =
        cap === 1 || numMultiplier === 0
          ? 0
          : (cap * (numMultiplier / 10)) + increment;
      const capTotalAmount = (cap + increment) * (numBaseRate + capAdjustment);
      const capTotalHours = cap + increment;
      const elrAtCap = capTotalAmount / capTotalHours;
      // Scale total amount to maintain ELR for hourRate > cap
      return elrAtCap * totalHours;
    } else {
      // Normal calculation for hourRate <= cap or cap disabled
      const adjustment =
        hourRate === 1 || numMultiplier === 0
          ? 0
          : (hourRate * (numMultiplier / 10)) + increment;
      return totalHours * (numBaseRate + adjustment);
    }
  };

  const handleMouseEnter = (e, hourRate, increment) => {
    const totalAmount = calculateValue(hourRate, increment);
    const totalHours = hourRate + increment;
    const elr = (totalAmount / totalHours).toFixed(2);
    
    const rect = e.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top - 10 + scrollTop,
      content: `ELR: $${elr}/hr`
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <AppContainer>
        <ThemeToggleButton onClick={toggleTheme}>
          {theme === 'light' ? <RiSunLine /> : <RiMoonLine />}
        </ThemeToggleButton>
        <Card>
          <HeaderContainer>
            <Title>
              Labor Rate<br />Matrix
            </Title>
            <InputsContainer>
              <InputGroup>
                <InputWrapper style={{ gridColumn: '1', gridRow: '1' }}>
                  <Label>Base Rate</Label>
                  <Input
                    type="number"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                  />
                </InputWrapper>
                <InputWrapper style={{ gridColumn: '2', gridRow: '1' }}>
                  <Label>Multiplier</Label>
                  <Input
                    type="number"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                  />
                </InputWrapper>
                <ToggleContainer style={{ gridColumn: '1', gridRow: '2' }}>
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
                <InputWrapper style={{ 
                  gridColumn: '2', 
                  gridRow: '2',
                  visibility: capEnabled ? 'visible' : 'hidden' 
                }}>
                  <Label>Cap Hour</Label>
                  <Input
                    type="number"
                    value={capValue}
                    onChange={(e) => setCapValue(e.target.value)}
                    step="1"
                    min="0"
                  />
                </InputWrapper>
              </InputGroup>
            </InputsContainer>
          </HeaderContainer>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>Labor Time</Th>
                  {increments.map((inc) => (
                    <Th key={inc} isFirstRow>
                      {inc.toFixed(1)}
                    </Th>
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
          </TableContainer>
        </Card>
        <Tooltip 
          show={tooltip.show}
          x={tooltip.x}
          y={tooltip.y}
        >
          {tooltip.content}
        </Tooltip>
      </AppContainer>
    </ThemeProvider>
  );
}

export default GridCalculator;