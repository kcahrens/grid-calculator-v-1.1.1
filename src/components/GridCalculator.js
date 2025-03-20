import { useState, useEffect, useMemo, useRef } from 'react';
import styled, { ThemeProvider, keyframes } from 'styled-components';
import { RiSunLine, RiMoonLine, RiLineChartLine, RiExchangeDollarLine, RiTableLine, RiFlashlightLine, RiLockLine, RiLockUnlockLine, RiUploadLine, RiFilePdfLine, RiFileExcel2Line, RiFileCopyLine, RiInfinityLine, RiTimeLine, RiTentFill, RiCrosshair2Fill, RiMoneyDollarBoxFill } from 'react-icons/ri';
import Graph from './Graph';

// Global default configuration for stores
const DEFAULT_STORE_CONFIG = {
  baseRate: '150',
  multiplier: '2', // Represents % increase per hour
  peakHours: '5',
  mode: 'infinity',
  q: '20',
  inputHours: '',
  capType: 'hours', // New: 'hours' or 'elr'
  maxELR: '200'     // New: Maximum Effective Labor Rate when capType is 'elr'
};

const DEFAULT_STORE_LOCK = {
  isLocked: false,
  lockedAt: null
};

// Themes
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

// Keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
`;

// Styled Components
const AnimatedDiv = styled.div`
  animation: ${({ isVisible }) => (isVisible ? fadeIn : fadeOut)} 0.3s ease-in-out forwards;
`;

const AppContainer = styled.div`
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  position: relative;
  box-sizing: border-box;
  margin: 0;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 20px;
  gap: 20px;
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
  margin: 0;
  flex: 0 0 auto;
  @media (max-width: 600px) {
    font-size: 28px;
  }
`;

const SearchableSelectContainer = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 200px;
  max-width: 472px;
  width: 100%;
  @media (max-width: 600px) {
    width: 100%;
    max-width: 472px;
  }
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
  flex: 0 0 auto;
`;

const IconButton = styled.button`
  background: ${({ active, theme }) => (active ? theme.accent : 'none')};
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  padding: 8px;
  color: ${({ active, theme, isLockButton, isLocked, disabled }) => 
    disabled ? theme.disabledText : (isLockButton && isLocked ? '#ff0000' : (active ? '#fff' : theme.text))};
  border-radius: 8px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${({ theme, isLockButton, isLocked, noHover, disabled }) => 
      disabled ? 'none' : (noHover ? 'none' : (isLockButton && isLocked ? 'rgba(255, 0, 0, 0.1)' : theme.accent))};
    color: ${({ isLockButton, isLocked, noHover, theme, disabled }) => 
      disabled ? theme.disabledText : (noHover ? (isLockButton && isLocked ? '#ff0000' : theme.text) : (isLockButton && isLocked ? '#ff0000' : '#fff'))};
  }
`;

// Styled component for the graph mode switch button with manual positioning
const GraphSwitchButton = styled(IconButton)`
  position: relative;
  top: 28px; /* Adjust this value to align with the icons */
  background: none; /* Ensure no backdrop */
  border: none; /* Ensure no border */
`;

const ExportDropdown = styled.div`
  position: relative;
`;

const ExportMenu = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
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
  align-items: center;
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
  align-items: center;
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
  align-items: center;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

const ModeSwitches = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const ModeLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const ModeButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const SwitchPanel = styled.div`
  background-color: ${({ theme }) => (theme === lightTheme ? '#e6e6e6' : '#404040')};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 120px;
`;

const PercentageInputWrapper = styled.div`
  position: relative;
  width: 100px;
  @media (max-width: 600px) {
    width: 150px;
  }
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
  text-align: center;
  box-sizing: border-box;
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

const PercentageInput = styled(Input)`
  padding-right: 24px;
`;

const PercentageSymbol = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  pointer-events: none;
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
  cursor: ${({ isFirstColumn }) => (isFirstColumn ? 'default' : 'pointer')};
`;

const Tooltip = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.tooltipBg};
  color: ${({ theme }) => theme.tooltipText};
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
  white-space: pre-line;
`;

const CalculatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ResultContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ResultText = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-size: 18px;
  padding: 0;
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const CopyToast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.accent};
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  opacity: ${({ show }) => (show ? 1 : 0)};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

// FadeWrapper Component
const FadeWrapper = ({ show, children }) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return shouldRender ? (
    <AnimatedDiv isVisible={show}>
      {children}
    </AnimatedDiv>
  ) : null;
};

// StoreDropdown Component
const StoreDropdown = ({ selectedStore, setSelectedStore, storeLocks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const stores = [
    "SUBURBAN NISSAN OF FARMINGTON HILLS - L408",
    "LITHIA RENO SUBARU - L038",
    "LITHIA CHRYSLER JEEP DODGE RAM OF KLAMATH FALLS - L020",
    "LITHIA HYUNDAI OF FRESNO - L029",
    "LITHIA CHRYSLER DODGE JEEP OF RENO - L145",
    "LITHIA HYUNDAI OF RENO - L048",
    "LITHIA TOYOTA OF MEDFORD - L006",
    "LITHIA NISSAN OF CLOVIS - L259",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF ROSEBURG - L063",
    "SUBURBAN TOYOTA OF TROY - L431",
    "HONOLULU VOLKSWAGEN - L254",
    "LITHIA TOYOTA OF REDDING - L058",
    "HONOLULU BUICK GMC CADILLAC - L253",
    "MICHAELS SUBARU OF BELLEVUE - L437",
    "ELK GROVE FORD - L547",
    "LITHIA HYUNDAI OF ANCHORAGE - L127",
    "LITHIA VOLKSWAGEN OF RENO - L034",
    "HONOLULU FORD - L280",
    "ELK GROVE SUBARU - L825",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF MEDFORD - L004",
    "LITHIA CHEVROLET OF REDDING - L057",
    "SUBURBAN TOYOTA OF FARMINGTON HILLS - L411",
    "GREINER FORD LINCOLN OF CASPER - L279",
    "LITHIA CHRYSLER DODGE JEEP RAM OF BEND - L361",
    "CHEVROLET OF BEND - L218",
    "CRATER LAKE FORD - L316",
    "BEND HONDA - L219",
    "LITHIA FORD OF KLAMATH FALLS - L227",
    "CHEVROLET BUICK GMC OF FAIRBANKS - L143",
    "BMW OF MONTEREY - L183",
    "LITHIA HONDA IN MEDFORD - L009",
    "KLAMATH FALLS TOYOTA - L019",
    "SUBURBAN CHRYSLER DODGE JEEP RAM OF FARMINGTON HILLS - L405",
    "SUBURBAN CHRYSLER DODGE JEEP RAM OF GARDEN CITY - L416",
    "PRIORITY TOYOTA SPRINGFIELD - L598",
    "BMW OF ANN ARBOR - L398",
    "ACURA OF HONOLULU - L272",
    "LITHIA KIA OF ANCHORAGE - L215",
    "SUBURBAN CHRYSLER DODGE JEEP RAM FIAT OF ANN ARBOR - L400",
    "LITHIA SUBARU OF OREGON CITY - L113",
    "LEXUS OF SACRAMENTO - L347",
    "LITHIA FORD LINCOLN OF FRESNO - L023",
    "SULLIVAN CJDR YUBA - L510",
    "CHEVROLET OF SOUTH ANCHORAGE - L148",
    "SUBURBAN CHEVROLET / CADILLAC OF ANN ARBOR - L399",
    "WESLEY CHAPEL HONDA - L342",
    "KEYES LEXUS OF VAN NUYS - L368",
    "LITHIA CHRYSLER JEEP DODGE OF GREAT FALLS - L152",
    "LITHIA SUBARU OF FRESNO - L228",
    "LITHIA CHRYSLER JEEP DODGE RAM OF SOUTH ANCHORAGE - L106",
    "KEYES TOYOTA - L371",
    "CENTENNIAL HYUNDAI - L446",
    "MICHAELS TOYOTA OF BELLEVUE - L436",
    "DCH KIA OF TEMECULA - L724",
    "LITHIA HONDA (CURRY) - L492",
    "SUBURBAN EXOTIC MOTORCARS MICHIGAN - L423",
    "HYUNDAI OF LAS VEGAS - L444",
    "LITHIA CHRYSLER JEEP DODGE RAM OF GRANTS PASS - L015",
    "LITHIA NISSAN OF EUGENE - L060",
    "AVONDALE NISSAN - L442",
    "AUDI DOWNTOWN LA - L307",
    "ELDER FORD OF TROY - L501",
    "FORD OF DOWNTOWN LA - L516",
    "ABC HYUNDAI - L447",
    "HONDA CARS OF ROCKWALL - L352",
    "SOUTHWEST KIA OF ROCKWALL - L452",
    "SUBURBAN FORD OF STERLING HEIGHTS - L419",
    "SUBURBAN MAZDA OF TROY - L428",
    "CHEVROLET OF WASILLA - L149",
    "SUBURBAN CADILLAC OF PLYMOUTH - L418",
    "JAGUAR MISSION VIEJO (LAND ROVER) - L336",
    "LITHIA NISSAN OF FRESNO - L027",
    "DCH AUDI OXNARD - L718",
    "AUDI CALABASAS - L756",
    "SPORT CITY TOYOTA - L351",
    "DCH TUSTIN ACURA - L719",
    "SOUTHWEST KIA OF MESQUITE - L453",
    "AUDI FARMINGTON HILLS - L403",
    "SUBURBAN MAZDA OF FARMINGTON HILLS - L407",
    "PORSCHE FARMINGTON HILLS - L403",
    "SUBURBAN VOLKSWAGEN OF FARMINGTON HILLS - L403",
    "VOLKSWAGEN OF SALEM - L241",
    "JEEP ONLY LAS VEGAS - L519",
    "BMW OF SHERMAN OAKS - L448",
    "SUBURBAN HONDA - L406",
    "SUBURBAN FORD OF WATERFORD - L434",
    "SUBURBAN FORD OF FERNDALE - L414",
    "SUBURBAN HYUNDAI - L425",
    "JAGUAR LAND ROVER TROY - L427",
    "SUBURBAN BUICK GMC OF TROY - L424",
    "SUBURBAN SUBARU OF TROY - L430",
    "DESERT 215 SUPERSTORE - L518",
    "SUBURBAN CHRYSLER DODGE JEEP RAM OF TROY - L422",
    "SUBURBAN CADILLAC OF TROY - L421",
    "SUBURBAN VOLVO CARS - L432",
    "MERCEDES BENZ OF ANN ARBOR - L401",
    "LITHIA FORD LINCOLN OF ROSEBURG - L061",
    "HONDA OF SALEM - L242",
    "GRAPEVINE HONDA - L346",
    "HENDERSON HYUNDAI SUPERSTORE - L541",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF SPOKANE - L275",
    "JOHN EAGLE HONDA OF DALLAS - L349",
    "ACURA OF SHERMAN OAKS - L449",
    "PORSCHE DOWNTOWN LA - L308",
    "ELDER FORD OF ROMEO - L502",
    "GENESIS OF LAS VEGAS - L445",
    "BUICK GMC OF BEAVERTON - L257 & L258",
    "DCH HONDA OF OXNARD - L715",
    "LITHIA CHRYSLER JEEP DODGE OF SANTA FE - L155",
    "CADILLAC OF PORTLAND DATA ONLY - L257",
    "BUICK GMC OF BEAVERTON (DATA ONLY) - L258",
    "AUDI FORT LAUDERDALE - L503",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF EUGENE - L059",
    "LITHIA CHRYSLER JEEP DODGE RAM OF WASILLA - L252",
    "DCH SUBARU OF THOUSAND OAKS - L363",
    "SAHARA CHRYSLER DODGE RAM - L517",
    "FREEDOM CDJR OF LEXINGTON - L580",
    "AUDI CORAL SPRINGS - L504",
    "LITHIA BMW OF SALEM - L240",
    "CAMP CHEVROLET - L051",
    "BMW OF SPOKANE - L052",
    "MERCEDES-BENZ OF PORTLAND - L223",
    "LITHIA TOYOTA OF SPRINGFIELD - L065",
    "LITHIA FORD OF MISSOULA - L267",
    "LITHIA CHEVROLET BUICK GMC OF HELENA - L146",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF HELENA - L157",
    "BMW OF ANCHORAGE - L154",
    "SUBARU OF SPOKANE - L053",
    "MINI OF ANCHORAGE - L235",
    "LITHIA CHRYSLER DODGE JEEP RAM OF POCATELLO - L099",
    "MERCEDES-BENZ OF LOS ANGELES - L304",
    "STERLING BMW - L379",
    "BELL ROAD TOYOTA - L378",
    "LITHIA ELDER FORD TAMPA - L499",
    "SUNRISE BUICK GMC AT WOLFCHASE - L815",
    "COON RAPIDS CDJR - L803",
    "HUDSON FORD - L801",
    "AUDI MINNEAPOLIS - L805",
    "AUDI ST. PAUL - L808",
    "HYUNDAI WESLEY CHAPEL - L394",
    "SUNRISE CHEVROLET BUICK GMC AT COLLIERVILLE - L816",
    "ALL AMERICAN CHEVROLET OF ODESSA - L026",
    "LITHIA CHRYSLER JEEP RAM FIAT OF BRYAN COLLEGE STATION - L173",
    "ALL AMERICAN CHEVROLET OF MIDLAND - L011",
    "BAIERL ACURA - L292",
    "NEW PORT RICHEY VOLKSWAGEN - L395",
    "HYUNDAI OF NEW PORT RICHEY - L396",
    "MINI OF PORTLAND - L225"
  ];

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      if (!isOpen) setIsOpen(true);
      else setHighlightedIndex(prev => prev === -1 ? 0 : Math.min(prev + 1, filteredStores.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) setHighlightedIndex(prev => prev === -1 ? filteredStores.length - 1 : Math.max(prev - 1, 0));
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
            if (!isOpen) setIsOpen(true);
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
              <RiLockLine title={`Locked at: ${new Date(storeLocks[store].lockedAt).toLocaleString()}`} />
            )}
          </OptionItem>
        ))}
      </OptionsList>
    </SearchableSelectContainer>
  );
};

// Main Component
function GridCalculator() {
  const stores = [
    "SUBURBAN NISSAN OF FARMINGTON HILLS - L408",
    "LITHIA RENO SUBARU - L038",
    "LITHIA CHRYSLER JEEP DODGE RAM OF KLAMATH FALLS - L020",
    "LITHIA HYUNDAI OF FRESNO - L029",
    "LITHIA CHRYSLER DODGE JEEP OF RENO - L145",
    "LITHIA HYUNDAI OF RENO - L048",
    "LITHIA TOYOTA OF MEDFORD - L006",
    "LITHIA NISSAN OF CLOVIS - L259",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF ROSEBURG - L063",
    "SUBURBAN TOYOTA OF TROY - L431",
    "HONOLULU VOLKSWAGEN - L254",
    "LITHIA TOYOTA OF REDDING - L058",
    "HONOLULU BUICK GMC CADILLAC - L253",
    "MICHAELS SUBARU OF BELLEVUE - L437",
    "ELK GROVE FORD - L547",
    "LITHIA HYUNDAI OF ANCHORAGE - L127",
    "LITHIA VOLKSWAGEN OF RENO - L034",
    "HONOLULU FORD - L280",
    "ELK GROVE SUBARU - L825",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF MEDFORD - L004",
    "LITHIA CHEVROLET OF REDDING - L057",
    "SUBURBAN TOYOTA OF FARMINGTON HILLS - L411",
    "GREINER FORD LINCOLN OF CASPER - L279",
    "LITHIA CHRYSLER DODGE JEEP RAM OF BEND - L361",
    "CHEVROLET OF BEND - L218",
    "CRATER LAKE FORD - L316",
    "BEND HONDA - L219",
    "LITHIA FORD OF KLAMATH FALLS - L227",
    "CHEVROLET BUICK GMC OF FAIRBANKS - L143",
    "BMW OF MONTEREY - L183",
    "LITHIA HONDA IN MEDFORD - L009",
    "KLAMATH FALLS TOYOTA - L019",
    "SUBURBAN CHRYSLER DODGE JEEP RAM OF FARMINGTON HILLS - L405",
    "SUBURBAN CHRYSLER DODGE JEEP RAM OF GARDEN CITY - L416",
    "PRIORITY TOYOTA SPRINGFIELD - L598",
    "BMW OF ANN ARBOR - L398",
    "ACURA OF HONOLULU - L272",
    "LITHIA KIA OF ANCHORAGE - L215",
    "SUBURBAN CHRYSLER DODGE JEEP RAM FIAT OF ANN ARBOR - L400",
    "LITHIA SUBARU OF OREGON CITY - L113",
    "LEXUS OF SACRAMENTO - L347",
    "LITHIA FORD LINCOLN OF FRESNO - L023",
    "SULLIVAN CJDR YUBA - L510",
    "CHEVROLET OF SOUTH ANCHORAGE - L148",
    "SUBURBAN CHEVROLET / CADILLAC OF ANN ARBOR - L399",
    "WESLEY CHAPEL HONDA - L342",
    "KEYES LEXUS OF VAN NUYS - L368",
    "LITHIA CHRYSLER JEEP DODGE OF GREAT FALLS - L152",
    "LITHIA SUBARU OF FRESNO - L228",
    "LITHIA CHRYSLER JEEP DODGE RAM OF SOUTH ANCHORAGE - L106",
    "KEYES TOYOTA - L371",
    "CENTENNIAL HYUNDAI - L446",
    "MICHAELS TOYOTA OF BELLEVUE - L436",
    "DCH KIA OF TEMECULA - L724",
    "LITHIA HONDA (CURRY) - L492",
    "SUBURBAN EXOTIC MOTORCARS MICHIGAN - L423",
    "HYUNDAI OF LAS VEGAS - L444",
    "LITHIA CHRYSLER JEEP DODGE RAM OF GRANTS PASS - L015",
    "LITHIA NISSAN OF EUGENE - L060",
    "AVONDALE NISSAN - L442",
    "AUDI DOWNTOWN LA - L307",
    "ELDER FORD OF TROY - L501",
    "FORD OF DOWNTOWN LA - L516",
    "ABC HYUNDAI - L447",
    "HONDA CARS OF ROCKWALL - L352",
    "SOUTHWEST KIA OF ROCKWALL - L452",
    "SUBURBAN FORD OF STERLING HEIGHTS - L419",
    "SUBURBAN MAZDA OF TROY - L428",
    "CHEVROLET OF WASILLA - L149",
    "SUBURBAN CADILLAC OF PLYMOUTH - L418",
    "JAGUAR MISSION VIEJO (LAND ROVER) - L336",
    "LITHIA NISSAN OF FRESNO - L027",
    "DCH AUDI OXNARD - L718",
    "AUDI CALABASAS - L756",
    "SPORT CITY TOYOTA - L351",
    "DCH TUSTIN ACURA - L719",
    "SOUTHWEST KIA OF MESQUITE - L453",
    "AUDI FARMINGTON HILLS - L403",
    "SUBURBAN MAZDA OF FARMINGTON HILLS - L407",
    "PORSCHE FARMINGTON HILLS - L403",
    "SUBURBAN VOLKSWAGEN OF FARMINGTON HILLS - L403",
    "VOLKSWAGEN OF SALEM - L241",
    "JEEP ONLY LAS VEGAS - L519",
    "BMW OF SHERMAN OAKS - L448",
    "SUBURBAN HONDA - L406",
    "SUBURBAN FORD OF WATERFORD - L434",
    "SUBURBAN FORD OF FERNDALE - L414",
    "SUBURBAN HYUNDAI - L425",
    "JAGUAR LAND ROVER TROY - L427",
    "SUBURBAN BUICK GMC OF TROY - L424",
    "SUBURBAN SUBARU OF TROY - L430",
    "DESERT 215 SUPERSTORE - L518",
    "SUBURBAN CHRYSLER DODGE JEEP RAM OF TROY - L422",
    "SUBURBAN CADILLAC OF TROY - L421",
    "SUBURBAN VOLVO CARS - L432",
    "MERCEDES BENZ OF ANN ARBOR - L401",
    "LITHIA FORD LINCOLN OF ROSEBURG - L061",
    "HONDA OF SALEM - L242",
    "GRAPEVINE HONDA - L346",
    "HENDERSON HYUNDAI SUPERSTORE - L541",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF SPOKANE - L275",
    "JOHN EAGLE HONDA OF DALLAS - L349",
    "ACURA OF SHERMAN OAKS - L449",
    "PORSCHE DOWNTOWN LA - L308",
    "ELDER FORD OF ROMEO - L502",
    "GENESIS OF LAS VEGAS - L445",
    "BUICK GMC OF BEAVERTON - L257 & L258",
    "DCH HONDA OF OXNARD - L715",
    "LITHIA CHRYSLER JEEP DODGE OF SANTA FE - L155",
    "CADILLAC OF PORTLAND DATA ONLY - L257",
    "BUICK GMC OF BEAVERTON (DATA ONLY) - L258",
    "AUDI FORT LAUDERDALE - L503",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF EUGENE - L059",
    "LITHIA CHRYSLER JEEP DODGE RAM OF WASILLA - L252",
    "DCH SUBARU OF THOUSAND OAKS - L363",
    "SAHARA CHRYSLER DODGE RAM - L517",
    "FREEDOM CDJR OF LEXINGTON - L580",
    "AUDI CORAL SPRINGS - L504",
    "LITHIA BMW OF SALEM - L240",
    "CAMP CHEVROLET - L051",
    "BMW OF SPOKANE - L052",
    "MERCEDES-BENZ OF PORTLAND - L223",
    "LITHIA TOYOTA OF SPRINGFIELD - L065",
    "LITHIA FORD OF MISSOULA - L267",
    "LITHIA CHEVROLET BUICK GMC OF HELENA - L146",
    "LITHIA CHRYSLER DODGE JEEP RAM FIAT OF HELENA - L157",
    "BMW OF ANCHORAGE - L154",
    "SUBARU OF SPOKANE - L053",
    "MINI OF ANCHORAGE - L235",
    "LITHIA CHRYSLER DODGE JEEP RAM OF POCATELLO - L099",
    "MERCEDES-BENZ OF LOS ANGELES - L304",
    "STERLING BMW - L379",
    "BELL ROAD TOYOTA - L378",
    "LITHIA ELDER FORD TAMPA - L499",
    "SUNRISE BUICK GMC AT WOLFCHASE - L815",
    "COON RAPIDS CDJR - L803",
    "HUDSON FORD - L801",
    "AUDI MINNEAPOLIS - L805",
    "AUDI ST. PAUL - L808",
    "HYUNDAI WESLEY CHAPEL - L394",
    "SUNRISE CHEVROLET BUICK GMC AT COLLIERVILLE - L816",
    "ALL AMERICAN CHEVROLET OF ODESSA - L026",
    "LITHIA CHRYSLER JEEP RAM FIAT OF BRYAN COLLEGE STATION - L173",
    "ALL AMERICAN CHEVROLET OF MIDLAND - L011",
    "BAIERL ACURA - L292",
    "NEW PORT RICHEY VOLKSWAGEN - L395",
    "HYUNDAI OF NEW PORT RICHEY - L396",
    "MINI OF PORTLAND - L225"
  ];

  const [selectedStore, setSelectedStore] = useState("SUBURBAN NISSAN OF FARMINGTON HILLS - L408");

  // Initialize storeConfigs with defaults for all stores
  const [storeConfigs, setStoreConfigs] = useState(() => {
    const configs = {};
    stores.forEach(store => {
      configs[store] = { ...DEFAULT_STORE_CONFIG };
    });
    return configs;
  });

  // Initialize storeLocks with defaults for all stores
  const [storeLocks, setStoreLocks] = useState(() => {
    const locks = {};
    stores.forEach(store => {
      locks[store] = { ...DEFAULT_STORE_LOCK };
    });
    return locks;
  });

  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('grid');
  const [showDollarAmount, setShowDollarAmount] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const dropdownRef = useRef(null);
  const lockButtonRef = useRef(null);
  let longPressTimer;

  // Theme detection
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  // Click outside handler for export menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const toggleLock = () => {
    setStoreLocks(prev => ({
      ...prev,
      [selectedStore]: {
        isLocked: !prev[selectedStore].isLocked,
        lockedAt: !prev[selectedStore].isLocked ? new Date().toISOString() : null
      }
    }));
  };

  const handleExportPDF = () => setShowExportMenu(false);
  const handleExportExcel = () => setShowExportMenu(false);

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : '';

  const hourRates = Array.from({ length: 21 }, (_, i) => i);
  const increments = Array.from({ length: 10 }, (_, i) => i * 0.1);

  const calculateValue = (totalHours, config = DEFAULT_STORE_CONFIG) => {
    const { baseRate, multiplier, mode, peakHours, q, capType, maxELR } = config;
    const numBaseRate = Number(baseRate) || 150;
    const p = Number(multiplier) || 0;
    const numMultiplier = 1 + (p / 1000); // per 0.1 hour
    let effectivePeakHours;

    // Determine effectivePeakHours based on capType
    if (mode === 'infinity') {
      effectivePeakHours = Infinity;
    } else if (capType === 'hours') {
      effectivePeakHours = Number(peakHours) || Infinity;
    } else if (capType === 'elr') {
      const numMaxELR = Number(maxELR) || Infinity;
      if (p > 0) {
        const a = p / 100; // scalingFactor = 1 + (p / 100) * (totalHours - 1)
        const targetScalingFactor = numMaxELR / numBaseRate;
        effectivePeakHours = targetScalingFactor > 1 ? 1 + (targetScalingFactor - 1) / a : 1.0;
      } else {
        effectivePeakHours = Infinity;
      }
    } else {
      effectivePeakHours = Infinity;
    }

    const numQ = Number(q) || 0;

    if (totalHours <= 0) return 0;

    const k = Math.round(totalHours * 10);
    let cellsPastOne = Math.max(0, k - 10);
    let scalingFactor = 1;

    if (mode === 'infinity') {
      scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
    } else if (mode === 'hoursCap') {
      const peakCells = Math.round(effectivePeakHours * 10) - 10;
      cellsPastOne = Math.min(cellsPastOne, peakCells);
      scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
    } else if (mode === 'mirror') {
      const peakCells = Math.round(effectivePeakHours * 10) - 10;
      if (totalHours <= effectivePeakHours) {
        scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
      } else {
        const cellsPastPeak = k - Math.round(effectivePeakHours * 10);
        const mirroredCells = peakCells - cellsPastPeak;
        cellsPastOne = Math.max(0, mirroredCells);
        scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
      }
    } else if (mode === 'proportional') {
      const peakCells = Math.max(0, Math.round(effectivePeakHours * 10) - 10);
      if (config.q === '') {
        const effectiveCellsPastOne = Math.min(cellsPastOne, peakCells);
        scalingFactor = 1 + (numMultiplier - 1) * effectiveCellsPastOne;
      } else {
        const peakScalingFactor = 1 + (numMultiplier - 1) * peakCells;
        if (totalHours <= effectivePeakHours) {
          scalingFactor = 1 + (numMultiplier - 1) * cellsPastOne;
        } else if (totalHours <= numQ && numQ > effectivePeakHours) {
          const decreaseFactor = (totalHours - effectivePeakHours) / (numQ - effectivePeakHours);
          scalingFactor = peakScalingFactor - (peakScalingFactor - 1) * decreaseFactor;
        } else {
          scalingFactor = 1;
        }
      }
    }

    let totalAmount = numBaseRate * scalingFactor * totalHours;

    if (mode === 'hoursCap' && totalHours > effectivePeakHours) {
      const peakCells = Math.round(effectivePeakHours * 10) - 10;
      const peakScalingFactor = 1 + (numMultiplier - 1) * peakCells;
      const peakAmount = numBaseRate * peakScalingFactor * effectivePeakHours;
      totalAmount = peakAmount + (totalHours - effectivePeakHours) * numBaseRate * peakScalingFactor;
    }

    return Number(totalAmount.toFixed(2));
  };

  const generateGraphData = (config) => {
    const data = [];
    hourRates.forEach((hourRate) => {
      increments.forEach((inc) => {
        const totalHours = hourRate + inc;
        if (totalHours >= 0) {
          const totalAmount = calculateValue(totalHours, config);
          const elr = totalHours > 0 ? parseFloat((totalAmount / totalHours).toFixed(2)) : 0;
          data.push({ hours: totalHours, elr, totalAmount });
        }
      });
    });
    return data.sort((a, b) => a.hours - b.hours);
  };

  const graphData = useMemo(() => generateGraphData(storeConfigs[selectedStore]), [selectedStore, storeConfigs]);

  const handleMouseEnter = (e, hourRate, inc) => {
    const totalHours = hourRate + inc;
    const totalAmount = calculateValue(totalHours, storeConfigs[selectedStore]);
    const elr = totalHours > 0 ? (totalAmount / totalHours).toFixed(2) : 'N/A';
    const rect = e.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top - 10 + scrollTop,
      content: `Hours: ${totalHours.toFixed(1)}\nELR: $${elr}`
    });
  };

  const handleMouseLeave = () => setTooltip({ show: false, x: 0, y: 0, content: '' });

  const handleTouchStart = () => {
    longPressTimer = setTimeout(() => {
      if (lockButtonRef.current) {
        const rect = lockButtonRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        setTooltip({
          show: true,
          x: rect.left + rect.width / 2 + scrollLeft,
          y: rect.top - 10 + scrollTop,
          content: storeLocks[selectedStore].isLocked ? `Locked at: ${formatDate(storeLocks[selectedStore].lockedAt)}` : 'Unlocked'
        });
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  };

  const numInputHours = Number(storeConfigs[selectedStore]?.inputHours || '');
  let totalAmount = 0;
  if (!isNaN(numInputHours) && numInputHours >= 0) {
    totalAmount = calculateValue(numInputHours, storeConfigs[selectedStore]);
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => console.log(`Copied: ${text}`))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const handleCopyTotalAmount = () => {
    copyToClipboard(totalAmount.toFixed(2));
    triggerCopyToast();
  };

  const handleGridCellClick = (value) => {
    copyToClipboard(value.toString());
    triggerCopyToast();
  };

  const triggerCopyToast = () => {
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 1500);
  };

  const onCopyValue = (value) => {
    copyToClipboard(value);
    triggerCopyToast();
  };

  const modes = [
    { name: 'infinity', icon: RiInfinityLine },
    { name: 'hoursCap', icon: RiTimeLine },
    { name: 'mirror', icon: RiTentFill },
    { name: 'proportional', icon: RiCrosshair2Fill }
  ];

  const isLocked = storeLocks[selectedStore]?.isLocked || false;

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <AppContainer>
        <Header>
          <Title>Labor Rate Matrix</Title>
          <StoreDropdown selectedStore={selectedStore} setSelectedStore={setSelectedStore} storeLocks={storeLocks} />
          <ButtonGroup>
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
              ref={lockButtonRef}
              onClick={toggleLock}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              isLockButton={true}
              isLocked={isLocked}
              title={isLocked ? `Locked at: ${formatDate(storeLocks[selectedStore]?.lockedAt)}` : ''}
            >
              {isLocked ? <RiLockLine size={24} /> : <RiLockUnlockLine size={24} />}
            </IconButton>
            <ExportDropdown ref={dropdownRef}>
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
                  value={storeConfigs[selectedStore]?.baseRate}
                  onChange={(e) => setStoreConfigs(prev => ({
                    ...prev,
                    [selectedStore]: { ...prev[selectedStore], baseRate: e.target.value }
                  }))}
                  disabled={isLocked}
                  placeholder="150"
                />
              </InputWrapper>
              {!isLocked && (
                <>
                  <InputWrapper>
                    <Label>Increase / Hr</Label>
                    <PercentageInputWrapper>
                      <PercentageInput
                        type="number"
                        value={storeConfigs[selectedStore].multiplier}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setStoreConfigs(prev => ({
                              ...prev,
                              [selectedStore]: { ...prev[selectedStore], multiplier: value }
                            }));
                          }
                        }}
                        step="0.1"
                        min="0"
                        placeholder="e.g., 2"
                        disabled={isLocked}
                      />
                      <PercentageSymbol>%</PercentageSymbol>
                    </PercentageInputWrapper>
                  </InputWrapper>
                  {storeConfigs[selectedStore].mode !== 'infinity' && storeConfigs[selectedStore].capType === 'hours' && (
                    <FadeWrapper show={true}>
                      <InputWrapper key="peakHours">
                        <Label>Peak Hours</Label>
                        <Input
                          type="number"
                          value={storeConfigs[selectedStore]?.peakHours ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
                              setStoreConfigs(prev => ({
                                ...prev,
                                [selectedStore]: { ...prev[selectedStore], peakHours: value }
                              }));
                            }
                          }}
                          step="0.1"
                          min="1"
                          placeholder="Hour Limit"
                        />
                      </InputWrapper>
                    </FadeWrapper>
                  )}
                  {storeConfigs[selectedStore].mode !== 'infinity' && storeConfigs[selectedStore].capType === 'elr' && (
                    <FadeWrapper show={true}>
                      <InputWrapper key="maxELR">
                        <Label>Max ELR</Label>
                        <Input
                          type="number"
                          value={storeConfigs[selectedStore]?.maxELR ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
                              setStoreConfigs(prev => ({
                                ...prev,
                                [selectedStore]: { ...prev[selectedStore], maxELR: value }
                              }));
                            }
                          }}
                          step="0.1"
                          min="0"
                          placeholder="Max ELR"
                        />
                      </InputWrapper>
                    </FadeWrapper>
                  )}
                  {storeConfigs[selectedStore].mode === 'proportional' && (
                    <FadeWrapper show={true}>
                      <InputWrapper key="endHours">
                        <Label>End Hours</Label>
                        <Input
                          type="number"
                          value={storeConfigs[selectedStore].q}
                          onChange={(e) => {
                            const value = e.target.value;
                            setStoreConfigs(prev => ({
                              ...prev,
                              [selectedStore]: { ...prev[selectedStore], q: value }
                            }));
                          }}
                          step="0.1"
                          min={Number(storeConfigs[selectedStore]?.peakHours) + 0.1 || 0.1}
                          placeholder="End Hours"
                        />
                      </InputWrapper>
                    </FadeWrapper>
                  )}
                </>
              )}
              {viewMode === 'calculator' && (
                <InputWrapper key="enterHours">
                  <Label>Enter Hours</Label>
                  <Input
                    type="number"
                    value={storeConfigs[selectedStore]?.inputHours || DEFAULT_STORE_CONFIG.inputHours}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || Number(value) >= 0) {
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
              )}
            </LeftInputs>
            <RightInputs>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {viewMode === 'graph' && (
                  <GraphSwitchButton
                    onClick={() => setShowDollarAmount(!showDollarAmount)}
                    noHover={true}
                  >
                    <RiExchangeDollarLine size={24} />
                  </GraphSwitchButton>
                )}
                {storeConfigs[selectedStore].mode !== 'infinity' && (
                  <ModeSwitches>
                    <ModeLabel>Cap Type</ModeLabel>
                    <SwitchPanel>
                      <ModeButtons>
                        <IconButton
                          onClick={() => !isLocked && setStoreConfigs(prev => ({ ...prev, [selectedStore]: { ...prev[selectedStore], capType: 'hours' } }))}
                          active={storeConfigs[selectedStore].capType === 'hours'}
                          disabled={isLocked}
                          title="Cap by Hours"
                        >
                          <RiTimeLine size={24} />
                        </IconButton>
                        <IconButton
                          onClick={() => !isLocked && setStoreConfigs(prev => ({ ...prev, [selectedStore]: { ...prev[selectedStore], capType: 'elr' } }))}
                          active={storeConfigs[selectedStore].capType === 'elr'}
                          disabled={isLocked}
                          title="Cap by ELR"
                        >
                          <RiMoneyDollarBoxFill size={24} />
                        </IconButton>
                      </ModeButtons>
                    </SwitchPanel>
                  </ModeSwitches>
                )}
                <ModeSwitches>
                  <ModeLabel>Grid Profile</ModeLabel>
                  <SwitchPanel>
                    <ModeButtons>
                      {modes.map((mode) => (
                        <IconButton
                          key={mode.name}
                          onClick={() => !isLocked && setStoreConfigs(prev => ({ ...prev, [selectedStore]: { ...prev[selectedStore], mode: mode.name } }))}
                          active={storeConfigs[selectedStore].mode === mode.name}
                          disabled={isLocked}
                          title={mode.name.charAt(0).toUpperCase() + mode.name.slice(1)}
                        >
                          <mode.icon size={24} />
                        </IconButton>
                      ))}
                    </ModeButtons>
                  </SwitchPanel>
                </ModeSwitches>
              </div>
            </RightInputs>
          </InputsContainer>
          {viewMode === 'graph' ? (
            <Graph
              data={graphData}
              baseRate={storeConfigs[selectedStore]?.baseRate || '150'}
              showDollarAmount={showDollarAmount}
              theme={theme}
              onCopyValue={onCopyValue}
            />
          ) : viewMode === 'calculator' ? (
            <CalculatorContainer>
              {storeConfigs[selectedStore]?.inputHours && !isNaN(numInputHours) && numInputHours >= 0 && (
                <ResultContainer>
                  <ResultText>Total Amount: ${totalAmount.toFixed(2)}</ResultText>
                  <CopyButton onClick={handleCopyTotalAmount} title="Copy Total Amount">
                    <RiFileCopyLine />
                  </CopyButton>
                </ResultContainer>
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
                      {increments.map((inc) => {
                        const totalHours = hourRate + inc;
                        const value = calculateValue(totalHours, storeConfigs[selectedStore]).toFixed(2);
                        return (
                          <Td
                            key={inc}
                            onMouseEnter={(e) => handleMouseEnter(e, hourRate, inc)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleGridCellClick(value)}
                            title="Click to copy"
                          >
                            {value}
                          </Td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          )}
        </Card>
        <Tooltip show={tooltip.show} x={tooltip.x} y={tooltip.y}>
          {tooltip.content}
        </Tooltip>
        <CopyToast show={showCopyToast}>Copied!</CopyToast>
      </AppContainer>
    </ThemeProvider>
  );
}

export default GridCalculator;