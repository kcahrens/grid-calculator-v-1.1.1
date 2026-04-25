import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { ThemeProvider, keyframes } from 'styled-components';
import { RiSunLine, RiMoonLine, RiLineChartLine, RiExchangeDollarLine, RiTableLine, RiUploadLine, RiDownloadLine, RiFilePdfLine, RiFileExcel2Line, RiFileCopyLine, RiInfinityLine, RiTimeLine, RiTentFill, RiCrosshair2Fill, RiMoneyDollarBoxFill, RiAlignTop, RiCloseLine, RiBarChartLine } from 'react-icons/ri';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import pkg from '../../package.json';
import { TOOLTIPS } from '../content/tooltips';
import Graph from './Graph';

const { version } = pkg;

const MODE_LABELS = {
  infinity: 'Infinity',
  hoursCap: 'Hours Cap',
  mirror: 'Mirror',
  proportional: 'Proportional'
};
const CAP_TYPE_LABELS = { hours: 'Hours', elr: 'ELR' };
const MODE_VALUES = Object.keys(MODE_LABELS);
const CAP_TYPE_VALUES = Object.keys(CAP_TYPE_LABELS);
const VIEW_MODES = ['grid', 'graph', 'calculator'];

const DEFAULT_CONFIG = {
  baseRate: '150',
  multiplier: '2',
  peakHours: '5',
  mode: 'infinity',
  q: '20',
  inputHours: '',
  capType: 'hours',
  maxELR: '200'
};

const buildParameterRows = (config, storeName) => {
  const rows = [
    ['Exported', new Date().toLocaleString()],
    ['Store Name', storeName || ''],
    ['Base Rate', config.baseRate],
    ['Increase / Hr (%)', config.multiplier],
    ['Grid Profile', MODE_LABELS[config.mode] || config.mode]
  ];
  if (config.mode !== 'infinity') {
    rows.push(['Cap Type', CAP_TYPE_LABELS[config.capType] || config.capType]);
    if (config.capType === 'hours') rows.push(['Peak Hours', config.peakHours]);
    if (config.capType === 'elr') rows.push(['Max ELR', config.maxELR]);
  }
  if (config.mode === 'proportional') rows.push(['End Hours', config.q]);
  return rows;
};

const calculateValue = (totalHours, config = DEFAULT_CONFIG) => {
  const { baseRate, multiplier, mode, peakHours, q, capType, maxELR } = config;
  const numBaseRate = Number(baseRate) || 150;
  const p = Number(multiplier) || 0;
  const numMultiplier = 1 + (p / 1000);
  let effectivePeakHours;

  if (mode === 'infinity') {
    effectivePeakHours = Infinity;
  } else if (capType === 'hours') {
    effectivePeakHours = Number(peakHours) || Infinity;
  } else if (capType === 'elr') {
    const numMaxELR = Number(maxELR) || Infinity;
    if (p > 0) {
      const a = p / 100;
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

const buildFilename = (store, ext) => {
  const safeStore = (store || '').trim().replace(/\s+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  return safeStore
    ? `LaborRateMatrix_${safeStore}_${date}.${ext}`
    : `LaborRateMatrix_${date}.${ext}`;
};

const buildExcelTitle = (store) => {
  const trimmed = (store || '').trim();
  return trimmed ? `Labor Rate Matrix — ${trimmed}` : 'Labor Rate Matrix';
};

const readStateFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const get = (k) => params.get(k);
  const mode = MODE_VALUES.includes(get('mode')) ? get('mode') : DEFAULT_CONFIG.mode;
  const capType = CAP_TYPE_VALUES.includes(get('cap')) ? get('cap') : DEFAULT_CONFIG.capType;
  const view = VIEW_MODES.includes(get('view')) ? get('view') : 'grid';
  const theme = get('theme') === 'dark' || get('theme') === 'light' ? get('theme') : null;
  return {
    storeName: get('name') || '',
    config: {
      baseRate: get('base') ?? DEFAULT_CONFIG.baseRate,
      multiplier: get('inc') ?? DEFAULT_CONFIG.multiplier,
      mode,
      capType,
      peakHours: get('peak') ?? DEFAULT_CONFIG.peakHours,
      maxELR: get('maxelr') ?? DEFAULT_CONFIG.maxELR,
      q: get('end') ?? DEFAULT_CONFIG.q,
      inputHours: get('hours') ?? DEFAULT_CONFIG.inputHours
    },
    viewMode: view,
    theme
  };
};

const writeStateToURL = ({ storeName, config, viewMode, theme }) => {
  const params = new URLSearchParams();
  if (storeName) params.set('name', storeName);
  if (config.baseRate !== DEFAULT_CONFIG.baseRate) params.set('base', config.baseRate);
  if (config.multiplier !== DEFAULT_CONFIG.multiplier) params.set('inc', config.multiplier);
  if (config.mode !== DEFAULT_CONFIG.mode) params.set('mode', config.mode);
  if (config.mode !== 'infinity') {
    if (config.capType !== DEFAULT_CONFIG.capType) params.set('cap', config.capType);
    if (config.capType === 'hours' && config.peakHours !== DEFAULT_CONFIG.peakHours) {
      params.set('peak', config.peakHours);
    }
    if (config.capType === 'elr' && config.maxELR !== DEFAULT_CONFIG.maxELR) {
      params.set('maxelr', config.maxELR);
    }
  }
  if (config.mode === 'proportional' && config.q !== DEFAULT_CONFIG.q) params.set('end', config.q);
  if (config.inputHours) params.set('hours', config.inputHours);
  if (viewMode !== 'grid') params.set('view', viewMode);
  if (theme) params.set('theme', theme);
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
};

const MODE_LABEL_TO_VALUE = Object.fromEntries(
  Object.entries(MODE_LABELS).map(([k, v]) => [v, k])
);
const CAP_LABEL_TO_VALUE = Object.fromEntries(
  Object.entries(CAP_TYPE_LABELS).map(([k, v]) => [v, k])
);

const parseImportedWorkbook = (wb) => {
  const sheet = wb.Sheets['Parameters'];
  if (!sheet) throw new Error("This isn't a Labor Rate Matrix export.");
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const map = {};
  rows.forEach((row) => {
    if (Array.isArray(row) && row.length >= 2 && row[0]) {
      map[String(row[0])] = row[1];
    }
  });
  const modeLabel = map['Grid Profile'];
  const mode = MODE_LABEL_TO_VALUE[modeLabel];
  if (!mode) throw new Error("This isn't a Labor Rate Matrix export.");
  const capLabel = map['Cap Type'];
  const capType = capLabel ? (CAP_LABEL_TO_VALUE[capLabel] || DEFAULT_CONFIG.capType) : DEFAULT_CONFIG.capType;
  const asString = (v, fallback) => (v === undefined || v === null || v === '' ? fallback : String(v));
  return {
    storeName: asString(map['Store Name'], ''),
    config: {
      baseRate: asString(map['Base Rate'], DEFAULT_CONFIG.baseRate),
      multiplier: asString(map['Increase / Hr (%)'], DEFAULT_CONFIG.multiplier),
      mode,
      capType,
      peakHours: asString(map['Peak Hours'], DEFAULT_CONFIG.peakHours),
      maxELR: asString(map['Max ELR'], DEFAULT_CONFIG.maxELR),
      q: asString(map['End Hours'], DEFAULT_CONFIG.q),
      inputHours: ''
    }
  };
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
  disabledText: '#a0a0a0',
  switchPanelBg: '#e6e6e6'
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
  disabledText: '#707070',
  switchPanelBg: '#404040'
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
  animation: ${({ $isVisible }) => ($isVisible ? fadeIn : fadeOut)} 0.3s ease-in-out forwards;
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

const StoreNameInput = styled.input`
  flex: 1 1 auto;
  min-width: 200px;
  max-width: 472px;
  padding: 8px 12px;
  background-color: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 0 0 auto;
`;

const IconButton = styled.button`
  background: ${({ $active, theme }) => ($active ? theme.accent : 'none')};
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  padding: 8px;
  color: ${({ $active, theme, disabled }) =>
    disabled ? theme.disabledText : ($active ? '#fff' : theme.text)};
  border-radius: 8px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${({ theme, disabled }) => disabled ? 'none' : theme.accent};
    color: ${({ theme, disabled }) => disabled ? theme.disabledText : '#fff'};
  }
`;

const GraphSwitchButton = styled(IconButton)`
  position: relative;
  top: 28px;
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
  display: ${({ $show }) => ($show ? 'block' : 'none')};
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
`;

const Modal = styled.div`
  background-color: ${({ theme }) => theme.cardBg};
  color: ${({ theme }) => theme.text};
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  padding: 24px;
  width: 100%;
  max-width: 480px;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  &:hover {
    background: ${({ theme }) => theme.border};
  }
`;

const DropZone = styled.div`
  border: 2px dashed ${({ $active, theme }) => ($active ? theme.accent : theme.border)};
  background: ${({ $active, theme }) => ($active ? `${theme.accent}14` : 'transparent')};
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.accent};
  }
`;

const DropZoneText = styled.p`
  margin: 0 0 6px 0;
  font-size: 15px;
`;

const DropZoneSubtext = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ModalMessage = styled.p`
  font-size: 15px;
  line-height: 1.4;
  margin: 0 0 20px 0;
`;

const ModalError = styled.p`
  color: #d32f2f;
  font-size: 14px;
  margin: 12px 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid ${({ $primary, theme }) => ($primary ? theme.accent : theme.border)};
  background: ${({ $primary, theme }) => ($primary ? theme.accent : 'transparent')};
  color: ${({ $primary, theme }) => ($primary ? '#fff' : theme.text)};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
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
  background-color: ${({ theme }) => theme.switchPanelBg};
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
  background-color: ${({ $isFirstColumn, theme }) =>
    $isFirstColumn ? theme.headerBg : theme.cardBg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 14px;
  text-align: center;
  font-size: 14px;
  font-weight: ${({ $isFirstColumn }) => ($isFirstColumn ? '700' : '400')};
  color: ${({ theme }) => theme.text};
  cursor: ${({ $isFirstColumn }) => ($isFirstColumn ? 'default' : 'pointer')};
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
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
  white-space: pre-line;
`;

const HintAnchor = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const LabelRow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const HintBubble = styled.div`
  position: fixed;
  background-color: ${({ theme }) => theme.tooltipBg};
  color: ${({ theme }) => theme.tooltipText};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
  width: max-content;
  max-width: min(280px, calc(100vw - 16px));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  z-index: 1500;
  pointer-events: none;
  white-space: normal;
`;

const InfoIconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  opacity: 0.4;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  &:hover { opacity: 0.9; }
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
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

const VersionLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.text};
  opacity: 0.4;
  margin-top: 16px;
  text-align: center;
`;

// HintTooltip — portal-rendered bubble that flips and clamps to stay in viewport
const HintTooltip = ({ text, children }) => {
  const anchorRef = useRef(null);
  const bubbleRef = useRef(null);
  const [hoverShown, setHoverShown] = useState(false);
  const [focusShown, setFocusShown] = useState(false);
  const [coords, setCoords] = useState(null);
  const visible = hoverShown || focusShown;

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current || !bubbleRef.current) return;
    // Measure the child (the actual button/icon), not the wrapper span.
    // Children may use position:relative/top offsets that the wrapper's
    // layout box doesn't account for, which would anchor the tooltip in
    // the wrong place.
    const target = anchorRef.current.firstElementChild || anchorRef.current;
    const a = target.getBoundingClientRect();
    const b = bubbleRef.current.getBoundingClientRect();
    const margin = 8;
    let top = a.top - b.height - margin;
    if (top < margin) top = a.bottom + margin;
    let left = a.left + a.width / 2 - b.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - b.width - margin));
    setCoords({ top, left });
  }, [visible, text]);

  const handleFocus = (e) => {
    // Only show on keyboard focus — suppresses the tooltip hanging around
    // after a mouse click on the wrapped button.
    const target = e.target;
    if (target && typeof target.matches === 'function' && target.matches(':focus-visible')) {
      setFocusShown(true);
    }
  };

  return (
    <HintAnchor
      ref={anchorRef}
      onMouseEnter={() => setHoverShown(true)}
      onMouseLeave={() => setHoverShown(false)}
      onFocus={handleFocus}
      onBlur={() => setFocusShown(false)}
    >
      {children}
      {visible && createPortal(
        <HintBubble
          ref={bubbleRef}
          role="tooltip"
          style={coords
            ? { top: coords.top, left: coords.left, visibility: 'visible' }
            : { top: 0, left: 0, visibility: 'hidden' }}
        >
          {text}
        </HintBubble>,
        document.body
      )}
    </HintAnchor>
  );
};

// InfoHint — the ⓘ affordance used beside input labels
const InfoHint = ({ text }) => (
  <HintTooltip text={text}>
    <InfoIconButton type="button" aria-label="More information">ⓘ</InfoIconButton>
  </HintTooltip>
);

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
    <AnimatedDiv $isVisible={show}>
      {children}
    </AnimatedDiv>
  ) : null;
};

// Main Component
function GridCalculator({ syncUrl = true }) {
  const initialState = useMemo(() => readStateFromURL(), []);

  useEffect(() => {
    const href = 'https://fonts.googleapis.com/css2?family=Red+Hat+Text:wght@700&display=swap';
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  const [storeName, setStoreName] = useState(initialState.storeName);
  const [config, setConfig] = useState(initialState.config);
  const [viewMode, setViewMode] = useState(initialState.viewMode);
  const [theme, setTheme] = useState(() => {
    if (initialState.theme) return initialState.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [showDollarAmount, setShowDollarAmount] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState('Copied!');
  const [importModalState, setImportModalState] = useState({ open: false, pending: null, error: null, dragActive: false });
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const hourRates = useMemo(() => Array.from({ length: 21 }, (_, i) => i), []);
  const increments = useMemo(() => Array.from({ length: 10 }, (_, i) => i * 0.1), []);

  useEffect(() => {
    if (!syncUrl) return;
    const timer = setTimeout(() => {
      writeStateToURL({ storeName, config, viewMode, theme: initialState.theme ? theme : null });
    }, 150);
    return () => clearTimeout(timer);
  }, [syncUrl, storeName, config, viewMode, theme, initialState.theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateConfig = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const buildGridRows = () => hourRates.map((hourRate) => [
    hourRate.toFixed(1),
    ...increments.map((inc) => calculateValue(hourRate + inc, config).toFixed(2))
  ]);

  const handleExportPDF = () => {
    setShowExportMenu(false);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const footerY = pageHeight - 24;
    const usableWidth = pageWidth - marginX * 2;
    const firstColWidth = 60;
    const dataColWidth = (usableWidth - firstColWidth) / increments.length;

    doc.setFontSize(16);
    doc.text(buildExcelTitle(storeName), marginX, 40);
    doc.setFontSize(10);
    doc.text(`Exported ${new Date().toLocaleString()}`, marginX, 58);

    const columnStyles = {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: firstColWidth }
    };
    increments.forEach((_, i) => {
      columnStyles[i + 1] = { halign: 'right', cellWidth: dataColWidth };
    });

    autoTable(doc, {
      startY: 74,
      margin: { left: marginX, right: marginX, bottom: 50 },
      head: [['Labor Time', ...increments.map((inc) => inc.toFixed(1))]],
      body: buildGridRows(),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [68, 114, 196], halign: 'center', textColor: 255 },
      columnStyles
    });

    const paramLine = buildParameterRows(config, storeName)
      .filter(([k, v]) => !(k === 'Store Name' && !v))
      .map(([k, v]) => `${k}: ${v}`)
      .join('   |   ');
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text(paramLine, pageWidth / 2, footerY, { align: 'center', maxWidth: usableWidth });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const preview = window.open(url, '_blank');
    if (preview) {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
      URL.revokeObjectURL(url);
      doc.save(buildFilename(storeName, 'pdf'));
    }
  };

  const handleExportExcel = () => {
    setShowExportMenu(false);

    const HEADER_FILL = '4472C4';
    const HEADER_TEXT = 'FFFFFF';
    const ALT_ROW_FILL = 'D9E1F2';
    const BORDER_COLOR = 'B4B4B4';

    const thinBorder = { style: 'thin', color: { rgb: BORDER_COLOR } };
    const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: '1F2937' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } }
    };

    const headerStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL } },
      font: { color: { rgb: HEADER_TEXT }, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: cellBorders
    };

    const titleText = buildExcelTitle(storeName);

    // Grid sheet
    const gridHeader = ['Labor Time', ...increments.map((inc) => Number(inc.toFixed(1)))];
    const gridData = hourRates.map((hourRate) => [
      Number(hourRate.toFixed(1)),
      ...increments.map((inc) => calculateValue(hourRate + inc, config))
    ]);
    const gridAoa = [[titleText], gridHeader, ...gridData];
    const gridSheet = XLSX.utils.aoa_to_sheet(gridAoa);
    gridSheet['!cols'] = [{ wch: 12 }, ...increments.map(() => ({ wch: 10 }))];
    gridSheet['!rows'] = [{ hpx: 40 }, { hpx: 30 }];
    gridSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: gridHeader.length - 1 } }];

    const titleCell = gridSheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
    if (titleCell) titleCell.s = titleStyle;

    for (let c = 0; c < gridHeader.length; c++) {
      const cell = gridSheet[XLSX.utils.encode_cell({ r: 1, c })];
      if (cell) cell.s = headerStyle;
    }

    for (let r = 2; r < gridAoa.length; r++) {
      for (let c = 0; c < gridHeader.length; c++) {
        const cell = gridSheet[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        const fill = (r - 2) % 2 === 0
          ? { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } }
          : { patternType: 'solid', fgColor: { rgb: ALT_ROW_FILL } };
        cell.s = {
          fill,
          alignment: { horizontal: c === 0 ? 'center' : 'right', vertical: 'center' },
          font: c === 0 ? { bold: true } : undefined,
          border: cellBorders
        };
        if (typeof cell.v === 'number' && c > 0) cell.z = '0.00';
      }
    }

    // Parameters sheet
    const paramRows = buildParameterRows(config, storeName);
    const paramAoa = [[titleText], ['Parameter', 'Value'], ...paramRows];
    const paramSheet = XLSX.utils.aoa_to_sheet(paramAoa);
    paramSheet['!cols'] = [{ wch: 22 }, { wch: 28 }];
    paramSheet['!rows'] = [{ hpx: 40 }, { hpx: 30 }];
    paramSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    const paramTitleCell = paramSheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
    if (paramTitleCell) paramTitleCell.s = titleStyle;

    for (let c = 0; c < 2; c++) {
      const cell = paramSheet[XLSX.utils.encode_cell({ r: 1, c })];
      if (cell) cell.s = headerStyle;
    }

    for (let r = 2; r < paramAoa.length; r++) {
      for (let c = 0; c < 2; c++) {
        const cell = paramSheet[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        const fill = (r - 2) % 2 === 0
          ? { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } }
          : { patternType: 'solid', fgColor: { rgb: ALT_ROW_FILL } };
        cell.s = {
          fill,
          alignment: { horizontal: 'left', vertical: 'center' },
          font: c === 0 ? { bold: true } : undefined,
          border: cellBorders
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, gridSheet, 'Grid');
    XLSX.utils.book_append_sheet(wb, paramSheet, 'Parameters');
    XLSX.writeFile(wb, buildFilename(storeName, 'xlsx'));
  };

  const openImportModal = () => {
    setShowExportMenu(false);
    setImportModalState({ open: true, pending: null, error: null, dragActive: false });
  };

  const closeImportModal = () => {
    setImportModalState({ open: false, pending: null, error: null, dragActive: false });
  };

  const processImportFile = async (file) => {
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      setImportModalState((s) => ({ ...s, error: 'Please select an .xlsx file.', dragActive: false }));
      return;
    }
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const parsed = parseImportedWorkbook(wb);
      setImportModalState({ open: true, pending: parsed, error: null, dragActive: false });
    } catch (err) {
      setImportModalState((s) => ({ ...s, pending: null, error: err.message || 'Could not read file.', dragActive: false }));
    }
  };

  const applyImport = () => {
    const pending = importModalState.pending;
    if (!pending) return;
    setStoreName(pending.storeName);
    setConfig(pending.config);
    closeImportModal();
    triggerToast('Imported!');
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImportFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    setImportModalState((s) => ({ ...s, dragActive: false }));
    if (file) processImportFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setImportModalState((s) => (s.dragActive ? s : { ...s, dragActive: true }));
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setImportModalState((s) => ({ ...s, dragActive: false }));
  };

  const graphData = useMemo(() => {
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
  }, [config, hourRates, increments]);

  const handleMouseEnter = (e, hourRate, inc) => {
    const totalHours = hourRate + inc;
    const totalAmount = calculateValue(totalHours, config);
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

  const numInputHours = Number(config.inputHours || '');
  let totalAmount = 0;
  if (!isNaN(numInputHours) && numInputHours >= 0) {
    totalAmount = calculateValue(numInputHours, config);
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .catch(() => triggerToast('Failed to copy'));
  };

  const triggerToast = (message = 'Copied!') => {
    setCopyToastMessage(message);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 1500);
  };

  const handleCopyTotalAmount = () => {
    copyToClipboard(totalAmount.toFixed(2));
    triggerToast();
  };

  const handleGridCellClick = (value) => {
    copyToClipboard(value.toString());
    triggerToast();
  };

  const onCopyValue = (value) => {
    copyToClipboard(value);
    triggerToast();
  };

  const modes = [
    { name: 'infinity', icon: RiInfinityLine, tooltip: TOOLTIPS.modeInfinity },
    { name: 'hoursCap', icon: RiAlignTop, tooltip: TOOLTIPS.modeHoursCap },
    { name: 'mirror', icon: RiTentFill, tooltip: TOOLTIPS.modeMirror },
    { name: 'proportional', icon: RiCrosshair2Fill, tooltip: TOOLTIPS.modeProportional }
  ];

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <AppContainer>
        <Header>
          <Title>Labor Rate Matrix</Title>
          <StoreNameInput
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store name (optional)"
            aria-label="Store name"
          />
          <ButtonGroup>
            {viewMode === 'grid' && (
              <ExportDropdown ref={dropdownRef}>
                <IconButton onClick={() => setShowExportMenu(!showExportMenu)} title="Export / Import">
                  <RiUploadLine size={24} />
                </IconButton>
                <ExportMenu $show={showExportMenu}>
                  <ExportOption onClick={handleExportPDF} title="Export PDF">
                    <RiFilePdfLine size={24} />
                  </ExportOption>
                  <ExportOption onClick={handleExportExcel} title="Export Excel">
                    <RiFileExcel2Line size={24} />
                  </ExportOption>
                  <ExportOption onClick={openImportModal} title="Import Excel">
                    <RiDownloadLine size={24} />
                  </ExportOption>
                </ExportMenu>
              </ExportDropdown>
            )}
            <IconButton onClick={() => setViewMode('graph')} $active={viewMode === 'graph'}>
              <RiLineChartLine size={24} />
            </IconButton>
            <IconButton onClick={() => setViewMode('grid')} $active={viewMode === 'grid'}>
              <RiTableLine size={24} />
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
                <LabelRow>
                  <Label>Base Rate</Label>
                  <InfoHint text={TOOLTIPS.baseRate} />
                </LabelRow>
                <Input
                  type="number"
                  value={config.baseRate}
                  onChange={(e) => updateConfig({ baseRate: e.target.value })}
                  placeholder="150"
                />
              </InputWrapper>
              <InputWrapper>
                <LabelRow>
                  <Label>Increase / Hr</Label>
                  <InfoHint text={TOOLTIPS.multiplier} />
                </LabelRow>
                <PercentageInputWrapper>
                  <PercentageInput
                    type="number"
                    value={config.multiplier}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || Number(value) >= 0) {
                        updateConfig({ multiplier: value });
                      }
                    }}
                    step="0.1"
                    min="0"
                    placeholder="e.g., 2"
                  />
                  <PercentageSymbol>%</PercentageSymbol>
                </PercentageInputWrapper>
              </InputWrapper>
              {config.mode !== 'infinity' && config.capType === 'hours' && (
                <FadeWrapper show={true}>
                  <InputWrapper key="peakHours">
                    <LabelRow>
                      <Label>Peak Hours</Label>
                      <InfoHint text={TOOLTIPS.peakHours} />
                    </LabelRow>
                    <Input
                      type="number"
                      value={config.peakHours ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
                          updateConfig({ peakHours: value });
                        }
                      }}
                      step="0.1"
                      min="1"
                      placeholder="Hour Limit"
                    />
                  </InputWrapper>
                </FadeWrapper>
              )}
              {config.mode !== 'infinity' && config.capType === 'elr' && (
                <FadeWrapper show={true}>
                  <InputWrapper key="maxELR">
                    <LabelRow>
                      <Label>Max ELR</Label>
                      <InfoHint text={TOOLTIPS.maxELR} />
                    </LabelRow>
                    <Input
                      type="number"
                      value={config.maxELR ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
                          updateConfig({ maxELR: value });
                        }
                      }}
                      step="0.1"
                      min="0"
                      placeholder="Max ELR"
                    />
                  </InputWrapper>
                </FadeWrapper>
              )}
              {config.mode === 'proportional' && (
                <FadeWrapper show={true}>
                  <InputWrapper key="endHours">
                    <LabelRow>
                      <Label>End Hours</Label>
                      <InfoHint text={TOOLTIPS.endHours} />
                    </LabelRow>
                    <Input
                      type="number"
                      value={config.q}
                      onChange={(e) => updateConfig({ q: e.target.value })}
                      step="0.1"
                      min={Number(config.peakHours) + 0.1 || 0.1}
                      placeholder="End Hours"
                    />
                  </InputWrapper>
                </FadeWrapper>
              )}
              {viewMode === 'calculator' && (
                <InputWrapper key="enterHours">
                  <LabelRow>
                    <Label>Enter Hours</Label>
                    <InfoHint text={TOOLTIPS.enterHours} />
                  </LabelRow>
                  <Input
                    type="number"
                    value={config.inputHours || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || Number(value) >= 0) {
                        updateConfig({ inputHours: value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (config.inputHours && !isNaN(Number(config.inputHours)) && Number(config.inputHours) >= 0) {
                          handleCopyTotalAmount();
                        }
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
                  <HintTooltip text={showDollarAmount ? TOOLTIPS.graphSwitchToELR : TOOLTIPS.graphSwitchToTotal}>
                    <GraphSwitchButton
                      onClick={() => setShowDollarAmount(!showDollarAmount)}
                      aria-label={showDollarAmount ? 'Show ELR on graph' : 'Show Total sales on graph'}
                    >
                      {showDollarAmount
                        ? <RiBarChartLine size={24} />
                        : <RiExchangeDollarLine size={24} />}
                    </GraphSwitchButton>
                  </HintTooltip>
                )}
                {config.mode !== 'infinity' && (
                  <ModeSwitches>
                    <ModeLabel>
                      <LabelRow>
                        <span>Cap Type</span>
                        <InfoHint text={TOOLTIPS.capType} />
                      </LabelRow>
                    </ModeLabel>
                    <SwitchPanel>
                      <ModeButtons>
                        <HintTooltip text={TOOLTIPS.capTypeHours}>
                          <IconButton
                            onClick={() => updateConfig({ capType: 'hours' })}
                            $active={config.capType === 'hours'}
                            aria-label="Cap by Hours"
                          >
                            <RiTimeLine size={24} />
                          </IconButton>
                        </HintTooltip>
                        <HintTooltip text={TOOLTIPS.capTypeELR}>
                          <IconButton
                            onClick={() => updateConfig({ capType: 'elr' })}
                            $active={config.capType === 'elr'}
                            aria-label="Cap by ELR"
                          >
                            <RiMoneyDollarBoxFill size={24} />
                          </IconButton>
                        </HintTooltip>
                      </ModeButtons>
                    </SwitchPanel>
                  </ModeSwitches>
                )}
                <ModeSwitches>
                  <ModeLabel>
                    <LabelRow>
                      <span>Grid Profile</span>
                      <InfoHint text={TOOLTIPS.gridProfile} />
                    </LabelRow>
                  </ModeLabel>
                  <SwitchPanel>
                    <ModeButtons>
                      {modes.map((mode) => (
                        <HintTooltip key={mode.name} text={mode.tooltip}>
                          <IconButton
                            onClick={() => updateConfig({ mode: mode.name })}
                            $active={config.mode === mode.name}
                            aria-label={`${MODE_LABELS[mode.name]} mode`}
                          >
                            <mode.icon size={24} />
                          </IconButton>
                        </HintTooltip>
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
              baseRate={config.baseRate || '150'}
              showDollarAmount={showDollarAmount}
              theme={theme}
              onCopyValue={onCopyValue}
            />
          ) : viewMode === 'calculator' ? (
            <CalculatorContainer>
              {config.inputHours && !isNaN(numInputHours) && numInputHours >= 0 && (
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
                      <Td $isFirstColumn>{hourRate.toFixed(1)}</Td>
                      {increments.map((inc) => {
                        const totalHours = hourRate + inc;
                        const value = calculateValue(totalHours, config).toFixed(2);
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
        {importModalState.open && (
          <ModalOverlay onClick={closeImportModal}>
            <Modal onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>
                  {importModalState.pending ? 'Confirm import' : 'Import from Excel'}
                </ModalTitle>
                <ModalCloseButton onClick={closeImportModal} aria-label="Close">
                  <RiCloseLine size={22} />
                </ModalCloseButton>
              </ModalHeader>
              {importModalState.pending ? (
                <>
                  <ModalMessage>
                    This will replace the current grid with values from the uploaded file. Continue?
                  </ModalMessage>
                  <ModalActions>
                    <ModalButton onClick={closeImportModal}>Cancel</ModalButton>
                    <ModalButton $primary onClick={applyImport}>Replace</ModalButton>
                  </ModalActions>
                </>
              ) : (
                <>
                  <DropZone
                    $active={importModalState.dragActive}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <DropZoneText>Drag &amp; drop a Labor Rate Matrix .xlsx here</DropZoneText>
                    <DropZoneSubtext>or click to choose a file</DropZoneSubtext>
                  </DropZone>
                  <HiddenFileInput
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileInputChange}
                  />
                  {importModalState.error && <ModalError>{importModalState.error}</ModalError>}
                </>
              )}
            </Modal>
          </ModalOverlay>
        )}
        <Tooltip $show={tooltip.show} $x={tooltip.x} $y={tooltip.y}>
          {tooltip.content}
        </Tooltip>
        <VersionLabel>v{version}</VersionLabel>
        <CopyToast $show={showCopyToast}>{copyToastMessage}</CopyToast>
      </AppContainer>
    </ThemeProvider>
  );
}

export default GridCalculator;