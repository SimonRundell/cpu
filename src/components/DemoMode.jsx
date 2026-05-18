/**
 * @fileoverview DemoMode — teacher-led sequential step-through of the FDE cycle.
 *
 * Also exports CpuDiagramSVGContent — the shared SVG diagram used by both modes.
 *
 * Bus y-coordinates (must match SparkLayer.jsx BUS_Y):
 *   Address Bus  y=108
 *   Data Bus     y=226
 *   Control Bus  y=344
 *
 * Every component edge is ≥30 px from its nearest bus line.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cycleSteps } from '../data/cycleSteps.js';
import { NODE_POSITIONS, NODE_SIZE } from '../data/nodePositions.js';
import SparkLayer from './SparkLayer.jsx';

const PHASE_LABELS = { fetch: 'FETCH', decode: 'DECODE', execute: 'EXECUTE' };
const AUTO_INTERVAL_MS = 2800;

const BUS_COLOURS = {
  address: 'var(--bus-address)',
  data:    'var(--bus-data)',
  control: 'var(--bus-control)',
};

/** Bus line definitions — y values are the clear-corridor midpoints */
const BUSES = [
  { y: 108, type: 'address', label: 'Address Bus' },
  { y: 226, type: 'data',    label: 'Data Bus'    },
  { y: 344, type: 'control', label: 'Control Bus' },
];

/**
 * Bus drop lines connect each component to the bus(es) it uses.
 * `useBottom: true`  → line starts from the component's bottom edge  (component is above bus)
 * `useBottom: false` → line starts from the component's top edge     (component is below bus)
 */
const DROP_LINES = [
  // Address Bus y=108
  { id: 'PC',  busY: 108, useBottom: true  },  // PC  bottom=78  → bus 108
  { id: 'MAR', busY: 108, useBottom: false },  // MAR top=138    ← bus 108
  { id: 'CU',  busY: 108, useBottom: false },  // CU  top=138    ← bus 108
  { id: 'RAM', busY: 108, useBottom: false },  // RAM top=256    ← bus 108

  // Data Bus y=226
  { id: 'MAR', busY: 226, useBottom: true  },  // MAR bottom=196 → bus 226
  { id: 'MDR', busY: 226, useBottom: false },  // MDR top=256    ← bus 226
  { id: 'ALU', busY: 226, useBottom: false },  // ALU top=256    ← bus 226
  { id: 'RAM', busY: 226, useBottom: false },  // RAM top=256    ← bus 226

  // Control Bus y=344
  { id: 'MDR', busY: 344, useBottom: true  },  // MDR bottom=314 → bus 344
  { id: 'CIR', busY: 344, useBottom: false },  // CIR top=374    ← bus 344
  { id: 'RAM', busY: 344, useBottom: true  },  // RAM bottom=314 → bus 344
];

/**
 * Accumulates register values up to the given step index for display inside nodes.
 * @param {number} upToIndex
 * @returns {Object}
 */
function buildRegisterValues(upToIndex) {
  const vals = {};
  for (let i = 0; i <= upToIndex; i++) {
    const step = cycleSteps[i];
    if (step?.registerUpdate) {
      const matches = step.registerUpdate.match(/(\w+)\s*=\s*([^,\n]+)/g) || [];
      matches.forEach((m) => {
        const [, reg, val] = m.match(/(\w+)\s*=\s*(.+)/);
        if (NODE_POSITIONS[reg]) vals[reg] = val.trim();
      });
    }
  }
  return vals;
}

/** Single CPU component box */
function ComponentBox({ id, label, sublabel, value, active, quizTarget, quizCorrect, quizWrong, onClick }) {
  const { x, y } = NODE_POSITIONS[id];
  const { w, h } = NODE_SIZE;

  let cls = 'cpu-node';
  if (active)      cls += ' cpu-node--active';
  if (quizTarget)  cls += ' cpu-node--target';
  if (quizCorrect) cls += ' cpu-node--correct';
  if (quizWrong)   cls += ' cpu-node--wrong';

  return (
    <g className={cls}
       transform={`translate(${x - w / 2},${y - h / 2})`}
       onClick={onClick}
       style={{ cursor: quizTarget ? 'pointer' : 'default' }}
       role={quizTarget ? 'button' : undefined}
       aria-label={quizTarget ? `Select ${label}` : undefined}>
      <rect width={w} height={h} rx="8" />
      <text x={w / 2} y={sublabel ? 18 : h / 2 + 5} className="node-label">{label}</text>
      {sublabel && <text x={w / 2} y={32} className="node-sublabel">{sublabel}</text>}
      {value && <text x={w / 2} y={h - 8} className="node-value">{value}</text>}
    </g>
  );
}

/**
 * All SVG diagram content — no outer <svg> tag.
 * Exported for reuse in QuizMode.
 */
export function CpuDiagramSVGContent({
  activeNodes = [],
  registerValues = {},
  quizTargets = [],
  quizCorrect = null,
  quizWrong = null,
  onNodeClick,
}) {
  const NP = NODE_POSITIONS;
  const NS = NODE_SIZE;
  const hw = NS.w / 2;
  const hh = NS.h / 2;

  const BUS_LEFT  = 65;
  const BUS_RIGHT = 875;

  const nodes = [
    { id: 'PC',  label: 'PC',  sublabel: 'Program Counter'   },
    { id: 'MAR', label: 'MAR', sublabel: 'Mem Address Reg'   },
    { id: 'MDR', label: 'MDR', sublabel: 'Mem Data Reg'      },
    { id: 'CIR', label: 'CIR', sublabel: 'Current Instr Reg' },
    { id: 'CU',  label: 'CU',  sublabel: 'Control Unit'      },
    { id: 'ALU', label: 'ALU', sublabel: 'Arith/Logic Unit'  },
    { id: 'ACC', label: 'ACC', sublabel: 'Accumulator'       },
    { id: 'RAM', label: 'RAM', sublabel: 'Main Memory'       },
  ];

  return (
    <>
      {/* CPU enclosure */}
      <rect x="40" y="10" width="640" height="442" className="cpu-enclosure" rx="12" />
      <text x="360" y="28" className="enclosure-label">CPU</text>

      {/* Cache indicator — top-right inside CPU, well above Address Bus */}
      <rect x="430" y="16" width="220" height="28" rx="6" className="cache-badge" />
      <text x="540" y="35" className="cache-label">Cache (fast — on-chip)</text>

      {/* Bus lines */}
      {BUSES.map(({ y, type, label }) => (
        <g key={type}>
          <line
            x1={BUS_LEFT} y1={y} x2={BUS_RIGHT} y2={y}
            stroke={BUS_COLOURS[type]} strokeWidth="3" strokeDasharray="6 3"
          />
          <polygon
            points={`${BUS_RIGHT},${y - 5} ${BUS_RIGHT + 10},${y} ${BUS_RIGHT},${y + 5}`}
            fill={BUS_COLOURS[type]}
          />
          <text x={BUS_LEFT} y={y - 6} className="bus-label" fill={BUS_COLOURS[type]}>{label}</text>
        </g>
      ))}

      {/* Bus drop lines — vertical stubs from component edge to bus */}
      {DROP_LINES.map(({ id, busY, useBottom }, i) => {
        const compY = useBottom ? NP[id].y + hh : NP[id].y - hh;
        return (
          <line key={i}
            x1={NP[id].x} y1={compY}
            x2={NP[id].x} y2={busY}
            className="bus-drop"
          />
        );
      })}

      {/* Internal wires — vertical column connectors */}
      <line x1={NP.PC.x}  y1={NP.PC.y  + hh} x2={NP.MAR.x} y2={NP.MAR.y - hh} className="internal-wire" />
      <line x1={NP.MAR.x} y1={NP.MAR.y + hh} x2={NP.MDR.x} y2={NP.MDR.y - hh} className="internal-wire" />
      <line x1={NP.MDR.x} y1={NP.MDR.y + hh} x2={NP.CIR.x} y2={NP.CIR.y - hh} className="internal-wire" />
      <line x1={NP.CU.x}  y1={NP.CU.y  + hh} x2={NP.ALU.x} y2={NP.ALU.y - hh} className="internal-wire" />
      <line x1={NP.ALU.x} y1={NP.ALU.y + hh} x2={NP.ACC.x} y2={NP.ACC.y - hh} className="internal-wire" />

      {/* MDR ↔ ALU — horizontal data path (same y level) */}
      <line
        x1={NP.MDR.x + hw} y1={NP.MDR.y}
        x2={NP.ALU.x - hw} y2={NP.ALU.y}
        className="internal-wire"
      />

      {/*
        CIR → CU — right-angle route through the internal channel (x=280).
        Avoids a diagonal line cutting across the diagram.
        Path: CIR right edge → channel → up → CU left edge
      */}
      <polyline
        points={`${NP.CIR.x + hw},${NP.CIR.y} 280,${NP.CIR.y} 280,${NP.CU.y} ${NP.CU.x - hw},${NP.CU.y}`}
        fill="none"
        className="internal-wire"
      />

      {/* Component boxes — rendered last so they sit above wires and buses */}
      {nodes.map(({ id, label, sublabel }) => (
        <ComponentBox
          key={id}
          id={id}
          label={label}
          sublabel={sublabel}
          value={registerValues[id] || ''}
          active={activeNodes.includes(id)}
          quizTarget={quizTargets.includes(id)}
          quizCorrect={quizCorrect === id}
          quizWrong={quizWrong === id}
          onClick={() => quizTargets.includes(id) && onNodeClick?.(id)}
        />
      ))}
    </>
  );
}

/** ──────────────────────────────────────────────────────────── */

export default function DemoMode({ onSwitchToQuiz }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [sparkKey,  setSparkKey]  = useState('init');
  const timerRef = useRef(null);

  const step      = cycleSteps[stepIndex];
  const isFirst   = stepIndex === 0;
  const isLast    = stepIndex === cycleSteps.length - 1;
  const regValues = buildRegisterValues(stepIndex);

  const triggerSpark = useCallback((idx) => {
    setSparkKey(`step-${idx}-${Date.now()}`);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      const n = Math.min(i + 1, cycleSteps.length - 1);
      triggerSpark(n);
      return n;
    });
  }, [triggerSpark]);

  const prev = useCallback(() => {
    setPlaying(false);
    setStepIndex((i) => {
      const p = Math.max(i - 1, 0);
      triggerSpark(p);
      return p;
    });
  }, [triggerSpark]);

  const reset = useCallback(() => {
    setPlaying(false);
    setStepIndex(0);
    triggerSpark(0);
  }, [triggerSpark]);

  const togglePlay = useCallback(() => {
    if (isLast) { reset(); return; }
    setPlaying((p) => !p);
  }, [isLast, reset]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStepIndex((i) => {
          if (i >= cycleSteps.length - 1) { setPlaying(false); return i; }
          const n = i + 1;
          triggerSpark(n);
          return n;
        });
      }, AUTO_INTERVAL_MS);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, triggerSpark]);

  useEffect(() => { triggerSpark(0); }, [triggerSpark]);

  const totalSteps = cycleSteps.length;
  const progress   = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="mode-layout">
      <div className="diagram-pane">
        <svg viewBox="0 0 960 460" className={`cpu-diagram phase-${step.phase}`}
          aria-label="CPU Fetch-Decode-Execute diagram">
          <CpuDiagramSVGContent
            activeNodes={step.activeNodes}
            registerValues={regValues}
          />
          <SparkLayer
            sparkPath={step.sparkPath}
            busType={step.busType}
            sparkKey={sparkKey}
            duration={1000}
          />
        </svg>
      </div>

      <div className="info-pane">
        <div className="progress-bar" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemax={totalSteps}>
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">Step {stepIndex + 1} of {totalSteps}</div>

        <div className="badges">
          <span className={`badge badge--${step.phase}`}>{PHASE_LABELS[step.phase]}</span>
          <span className="badge badge--instruction">{step.instruction}</span>
        </div>

        <h2 className="step-title">{step.title}</h2>
        <p className="step-explanation">{step.explanation}</p>

        <div className="register-update">
          <span className="register-update__label">Register update:</span>
          <code className="register-update__value">{step.registerUpdate}</code>
        </div>

        <div className="controls">
          <button className="btn btn--secondary" onClick={reset} disabled={isFirst && !playing}>↺ Reset</button>
          <button className="btn btn--primary"   onClick={togglePlay}>
            {playing ? '⏸ Pause' : isLast ? '↺ Replay' : '▶ Play'}
          </button>
          <button className="btn btn--secondary" onClick={prev}  disabled={isFirst}>◀ Prev</button>
          <button className="btn btn--secondary" onClick={next}  disabled={isLast || playing}>Next ▶</button>
        </div>

        <button className="btn btn--quiz-switch" onClick={onSwitchToQuiz}>
          Try the Quiz →
        </button>
      </div>
    </div>
  );
}
