// src/components/GridCalculator.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { RiSunLine, RiMoonLine, RiLineChartLine, RiExchangeDollarLine, RiTableLine, RiFlashlightLine, RiLockLine, RiLockUnlockLine, RiUploadLine, RiFilePdfLine, RiFileExcel2Line } from 'react-icons/ri';
import Graph from './Graph'; 

// Define themes with disabled styles
const lightTheme = {
  background: '#f5f7fa',
  cardBg: '#ffffff',
  text: '#1c2526',
  border: '#d1d9e0',
  accent: '#007aff',
  headerBg: '#eef2f5',
  tooltipBg: '#ffffff',
  tooltipText: '#1c2526',
  disabledBg: '#e0e0e0',
  disabledText: '#a0a0a0'
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
  disabledBg: '#404040',
  disabledText: '#707070'
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
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const Title = styled.h1`
  font-family: 'Red Hat Text', sans-serif !important;
  font-size: 36px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-align: center;
  letter-spacing: -0.5px;
  @media (max-width: 600px) {
    font-size: 28px;
  }
`;

const SearchableSelectContainer = styled.div`
  position: relative;
  width: 300px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
  &::after {
    content: '▼';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.text};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  padding: 8px 30px 8px 12px;
  background-color: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const OptionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 10;
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
`;

const OptionItem = styled.li`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  background-color: ${({ isHighlighted, theme }) =>
    isHighlighted ? theme.accent : 'transparent'};
  color: ${({ isHighlighted, isLocked, theme }) =>
    isHighlighted ? '#fff' : (isLocked ? 'red' : theme.text)};
  &:hover {
    background-color: ${({ theme }) => theme.accent};
    color: #fff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const IconButton = styled.button`
  background: ${({ active, theme }) => (active ? theme.accent : 'none')};
  border: none;
  cursor: pointer;
  padding: 8px;
  color: ${({ active, theme, isLockButton, isLocked }) => 
    isLockButton && isLocked ? '#ff0000' : (active ? '#fff' : theme.text)};
  border-radius: 8px;
  &:hover {
    background: ${({ theme, isLockButton, isLocked }) => 
      isLockButton && isLocked ? 'rgba(255, 0, 0, 0.1)' : theme.accent};
    color: ${({ isLockButton, isLocked }) => 
      isLockButton && isLocked ? '#ff0000' : '#fff'};
  }
`;

const ExportDropdown = styled.div`
  position: relative;
`;

const ExportMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background-color: ${({ theme }) => theme.cardBg};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 8px;
  margin-top: 4px;
  display: ${({ show }) => (show ? 'block' : 'none')};
  z-index: 10;
`;

const ExportOption = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  border-radius: 4px;
  &:hover {
    background-color: ${({ theme }) => theme.accent};
    color: #fff;
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
  &:disabled {
    background-color: ${({ theme }) => theme.disabledBg};
    color: ${({ theme }) => theme.disabledText};
    cursor: not-allowed;
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
    background-color: ${({ theme, disabled }) => (disabled ? theme.disabledBg : theme.accent)};
  }
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme, disabled, checked }) =>
    disabled ? theme.disabledBg : (checked ? theme.accent : theme.border)};
  border-radius: 24px;
  &:before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: ${({ theme, disabled }) =>
      disabled ? theme.disabledText : theme.text};
    border-radius: 50%;
    transition: transform 0.3s ease;
    transform: ${({ checked }) => (checked ? 'translateX(26px)' : 'translateX(0)')};
  }
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  max-width: 100%;
`;

const Table = styled.table`
  width: 100%;
  min-width: 800px;
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

const CalculatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ResultText = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const StoreDropdown = ({ selectedStore, setSelectedStore, storeLocks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const stores = ["Store A", "Store B", "Store C"];   // all stores user has access to ideally

  const filteredStores = stores.filter(store =>
    store.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (store) => {
    setSelectedStore(store);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => prev === -1 ? 0 : Math.min(prev + 1, filteredStores.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex(prev => prev === -1 ? filteredStores.length - 1 : Math.max(prev - 1, 0));
      }
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredStores[highlightedIndex]);
    }
  };

  return (
    <SearchableSelectContainer ref={dropdownRef}>
      <SearchInputWrapper>
        <SearchInput
          type="text"
          value={isOpen ? searchTerm : selectedStore || ''}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? 'Search stores...' : 'Select a store'}
        />
      </SearchInputWrapper>
      <OptionsList isOpen={isOpen}>
        {filteredStores.map((store, index) => (
          <OptionItem
            key={store}
            onClick={() => handleSelect(store)}
            isHighlighted={index === highlightedIndex}
            isLocked={storeLocks[store]?.isLocked || false}
          >
            <span>{store}</span>
            <div style={{ flexGrow: 1 }} />
            {storeLocks[store]?.isLocked && (
              <RiLockLine 
                title={`Locked at: ${new Date(storeLocks[store].lockedAt).toLocaleString()} // this would also include the user name that locked it`}
              />
            )}
          </OptionItem>
        ))}
      </OptionsList>
    </SearchableSelectContainer>
  );
};

function GridCalculator() {
  const [selectedStore, setSelectedStore] = useState("Store A");
  const [storeConfigs, setStoreConfigs] = useState({
    "Store A": { baseRate: '100', multiplier: '10', capEnabled: false, capValue: '', inputHours: '' },
    "Store B": { baseRate: '100', multiplier: '10', capEnabled: false, capValue: '', inputHours: '' },
    "Store C": { baseRate: '100', multiplier: '10', capEnabled: false, capValue: '', inputHours: '' }
  });
  const [storeLocks, setStoreLocks] = useState({
    "Store A": { isLocked: false, lockedAt: null },
    "Store B": { isLocked: false, lockedAt: null },
    "Store C": { isLocked: false, lockedAt: null }
  });
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('calculator');
  const [showDollarAmount, setShowDollarAmount] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLock = () => {
    setStoreLocks(prev => ({
      ...prev,
      [selectedStore]: {
        isLocked: !prev[selectedStore].isLocked,
        lockedAt: !prev[selectedStore].isLocked ? new Date().toISOString() : null
      }
    }));
  };

  const handleExportPDF = () => {
    // Rino, this would genorate a PDF of the grid
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    // use API to generate Excel of the grid
    setShowExportMenu(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const hourRates = Array.from({ length: 21 }, (_, i) => i);
  const increments = Array.from({ length: 10 }, (_, i) => i * 0.1);

  const calculateValue = (hourRate, increment, config, isCapCalculation = false) => {
    const { baseRate, multiplier, capEnabled, capValue } = config;
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
      const cap = Number(capValue);
      if (cap > 0 && totalHours >= cap) {
        const capHourRate = Math.floor(cap);
        const capIncrement = cap - capHourRate;
        const capValueAtLimit = calculateValue(capHourRate, capIncrement, config, true);
        const cappedELR = capValueAtLimit / cap;
        value = totalHours * cappedELR;
      }
    }

    return value;
  };

  const generateGraphData = (config) => {
    const data = [];
    hourRates.forEach((hourRate) => {
      increments.forEach((inc) => {
        const totalHours = hourRate + inc;
        if (totalHours >= 1.0) {
          const totalAmount = calculateValue(hourRate, inc, config);
          const elr = totalHours > 0 ? parseFloat((totalAmount / totalHours).toFixed(2)) : 0;
          data.push({ hours: totalHours, elr, totalAmount });
        }
      });
    });
    return data.sort((a, b) => a.hours - b.hours);
  };

  const graphData = useMemo(() => generateGraphData(storeConfigs[selectedStore]), [selectedStore, storeConfigs]);

  const handleMouseEnter = (e, hourRate, increment) => {
    const totalAmount = calculateValue(hourRate, increment, storeConfigs[selectedStore]);
    const totalHours = hourRate + increment;
    let elr = totalHours === 0 ? 'N/A' : (totalAmount / totalHours).toFixed(2);
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

  const numInputHours = Number(storeConfigs[selectedStore].inputHours);
  let totalAmount = 0;
  if (!isNaN(numInputHours) && numInputHours >= 0) {
    const hourRate = Math.floor(numInputHours);
    const increment = numInputHours - hourRate;
    totalAmount = calculateValue(hourRate, increment, storeConfigs[selectedStore]);
  }

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <AppContainer>
        <Header>
          <Title>Labor Rate Matrix</Title>
          <StoreDropdown 
            selectedStore={selectedStore} 
            setSelectedStore={setSelectedStore} 
            storeLocks={storeLocks} 
          />
          <ButtonGroup>
            {viewMode === 'graph' && (
              <IconButton onClick={() => setShowDollarAmount(!showDollarAmount)}>
                <RiExchangeDollarLine size={24} />
              </IconButton>
            )}
            <IconButton onClick={() => setViewMode('graph')} active={viewMode === 'graph'}>
              <RiLineChartLine size={24} />
            </IconButton>
            <IconButton onClick={() => setViewMode('grid')} active={viewMode === 'grid'}>
              <RiTableLine size={24} />
            </IconButton>
            <IconButton onClick={() => setViewMode('calculator')} active={viewMode === 'calculator'}>
              <RiFlashlightLine size={24} />
            </IconButton>
            <IconButton
              onClick={toggleLock}
              isLockButton={true}
              isLocked={storeLocks[selectedStore].isLocked}
              title={storeLocks[selectedStore].isLocked ? `Locked at: ${formatDate(storeLocks[selectedStore].lockedAt)}` : ''}
            >
              {storeLocks[selectedStore].isLocked ? <RiLockLine size={24} /> : <RiLockUnlockLine size={24} />}
            </IconButton>
            <ExportDropdown>
              <IconButton onClick={() => setShowExportMenu(!showExportMenu)}>
                <RiUploadLine size={24} />
              </IconButton>
              <ExportMenu show={showExportMenu}>
                <ExportOption onClick={handleExportPDF}>
                  <RiFilePdfLine size={24} />
                </ExportOption>
                <ExportOption onClick={handleExportExcel}>
                  <RiFileExcel2Line size={24} />
                </ExportOption>
              </ExportMenu>
            </ExportDropdown>
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
                  value={storeConfigs[selectedStore].baseRate}
                  onChange={(e) => setStoreConfigs(prev => ({
                    ...prev,
                    [selectedStore]: { ...prev[selectedStore], baseRate: e.target.value }
                  }))}
                  disabled={storeLocks[selectedStore].isLocked}
                />
              </InputWrapper>
              <InputWrapper>
                <Label>Multiplier</Label>
                <Input
                  type="number"
                  value={storeConfigs[selectedStore].multiplier}
                  onChange={(e) => setStoreConfigs(prev => ({
                    ...prev,
                    [selectedStore]: { ...prev[selectedStore], multiplier: e.target.value }
                  }))}
                  disabled={storeLocks[selectedStore].isLocked}
                />
              </InputWrapper>
            </LeftInputs>
            <RightInputs>
              {storeConfigs[selectedStore].capEnabled && (
                <InputWrapper>
                  <Label>Cap Hour</Label>
                  <Input
                    type="number"
                    value={storeConfigs[selectedStore].capValue}
                    onChange={(e) => setStoreConfigs(prev => ({
                      ...prev,
                      [selectedStore]: { ...prev[selectedStore], capValue: e.target.value }
                    }))}
                    step="0.1"
                    min="0"
                    disabled={storeLocks[selectedStore].isLocked}
                  />
                </InputWrapper>
              )}
              <ToggleContainer>
                <Label>Cap Matrix</Label>
                <ToggleWrapper>
                  <ToggleInput
                    type="checkbox"
                    checked={storeConfigs[selectedStore].capEnabled}
                    onChange={(e) => setStoreConfigs(prev => ({
                      ...prev,
                      [selectedStore]: { ...prev[selectedStore], capEnabled: e.target.checked }
                    }))}
                    disabled={storeLocks[selectedStore].isLocked}
                  />
                  <ToggleSlider disabled={storeLocks[selectedStore].isLocked} checked={storeConfigs[selectedStore].capEnabled} />
                </ToggleWrapper>
              </ToggleContainer>
            </RightInputs>
          </InputsContainer>
          {viewMode === 'graph' ? (
            <Graph data={graphData} baseRate={storeConfigs[selectedStore].baseRate} showDollarAmount={showDollarAmount} theme={theme} />
          ) : viewMode === 'calculator' ? (
            <CalculatorContainer>
              <InputWrapper>
                <Label>Enter Hours</Label>
                <Input
                  type="number"
                  value={storeConfigs[selectedStore].inputHours}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (Number(value) >= 0)) {
                      setStoreConfigs(prev => ({
                        ...prev,
                        [selectedStore]: { ...prev[selectedStore], inputHours: value }
                      }));
                    }
                  }}
                  step="0.1"
                  min="0"
                  placeholder="e.g., 5.5"
                />
              </InputWrapper>
              {storeConfigs[selectedStore].inputHours && !isNaN(numInputHours) && numInputHours >= 0 && (
                <ResultText>Total Amount: ${totalAmount.toFixed(2)}</ResultText>
              )}
            </CalculatorContainer>
          ) : (
            <TableContainer>
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
                          {calculateValue(hourRate, inc, storeConfigs[selectedStore]).toFixed(2)}
                        </Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          )}
        </Card>
        {viewMode === 'grid' && (
          <Tooltip show={tooltip.show} x={tooltip.x} y={tooltip.y}>
            {tooltip.content}
          </Tooltip>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default GridCalculator;