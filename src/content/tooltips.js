export const TOOLTIPS = {
  baseRate:
    'The standard hourly labor rate at 1.0 hours. All matrix values are calculated as a multiple of this rate.',

  multiplier:
    'How much the effective labor rate increases per additional 0.1 hour increment beyond 1.0 hr. E.g. 2% means each tenth of an hour adds 2% to the rate scaling.',

  peakHours:
    'The hour at which the rate stops increasing. Behavior after this point depends on the Grid Profile selected.',

  maxELR:
    'The maximum Effective Labor Rate (ELR) allowed. The calculator works backwards to find the hour at which this rate would be reached and uses that as the peak.',

  endHours:
    'Used in Proportional mode. The rate decreases from peak back to base between Peak Hours and End Hours, then holds at base beyond that.',

  enterHours:
    'Enter a specific labor time to calculate the exact matrix amount. Press Enter to copy the result.',

  capType:
    'Controls how the rate increase is capped — either by a specific hour limit or by a maximum Effective Labor Rate (ELR).',

  capTypeHours:
    'Cap by Hours: the rate scales up until the specified Peak Hours, then behavior is determined by the Grid Profile.',

  capTypeELR:
    'Cap by ELR: set a maximum Effective Labor Rate. The calculator automatically determines the equivalent peak hour.',

  gridProfile:
    'Defines the shape of the rate curve — how the labor rate behaves as hours increase beyond the peak.',

  modeInfinity:
    'Infinity: the rate increases indefinitely with no cap. Every 0.1 hour increment beyond 1.0 hr adds to the scaling factor.',

  modeHoursCap:
    'Hours Cap: the rate increases up to Peak Hours, then holds flat — the peak rate continues to apply for all hours beyond the cap.',

  modeMirror:
    'Mirror: the rate increases up to Peak Hours, then mirrors back down symmetrically. At 2× Peak Hours the rate returns to base.',

  modeProportional:
    'Proportional: the rate increases up to Peak Hours, then gradually decreases back to base rate by End Hours. Beyond End Hours the base rate applies.',

  graphSwitchToELR:
    'Show ELR on graph',

  graphSwitchToTotal:
    'Show Total sales',
};
