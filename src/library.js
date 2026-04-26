import React from 'react';
import ReactDOM from 'react-dom/client';
import GridCalculator from './components/GridCalculator';

export { GridCalculator };

export function mount(element, props = {}) {
  const root = ReactDOM.createRoot(element);
  root.render(React.createElement(GridCalculator, props));
  return () => root.unmount();
}
