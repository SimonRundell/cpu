/**
 * @fileoverview CpuDiagram — SVG layout of all CPU components and buses.
 *
 * The diagram is drawn in a fixed 900×520 viewBox so it scales responsively.
 * Layout:
 *   Left column  : PC, MAR, MDR, CIR  (registers)
 *   Centre column: CU, ALU, ACC        (CPU core)
 *   Right column : RAM                  (memory)
 *
 * Three buses run horizontally:
 *   Address Bus — top horizontal line (PC/MAR ↔ RAM)
 *   Data Bus    — middle horizontal line (MDR/CIR ↔ RAM)
 *   Control Bus — bottom horizontal line (CU ↔ RAM)
 */

import { NODE_POSITIONS, NODE_SIZE } from '../data/nodePositions.js';

/** Colours per bus type, resolved via CSS variables for dark/light mode */
const BUS_COLOURS = {
  address: 'var(--bus-address)',
  data:    'var(--bus-data)',
  control: 'var(--bus-control)',
};

/** Colour for each phase badge */
const PHASE_COLOURS = {
  fetch:   'var(--phase-fetch)',
  decode:  'var(--phase-decode)',
  execute: 'var(--phase-execute)',
};

/**
 * A single CPU component box (register or unit).
 *
 * @param {Object}   props
 * @param {string}   props.id          - component key matching NODE_POSITIONS
 * @param {string}   props.label       - display name
 * @param {string}   props.sublabel    - optional small description
 * @param {string}   props.value       - register value string shown inside
 * @param {boolean}  props.active      - highlight this node
 * @param {boolean}  props.quizTarget  - pulse to invite click
 * @param {boolean}  props.quizCorrect - flash green briefly
 * @param {boolean}  props.quizWrong   - flash red briefly
 * @param {Function} props.onClick     - quiz click handler
 */
function ComponentBox({ id, label, sublabel, value, active, quizTarget, quizCorrect, quizWrong, onClick }) {
  const pos = NODE_POSITIONS[id];
  const w = NODE_SIZE.w;
  const h = NODE_SIZE.h;
  const cx = pos.x;
  const cy = pos.y;

  let cls = 'cpu-node';
  if (active)      cls += ' cpu-node--active';
  if (quizTarget)  cls += ' cpu-node--target';
  if (quizCorrect) cls += ' cpu-node--correct';
  if (quizWrong)   cls += ' cpu-node--wrong';

  return (
    <g
      className={cls}
      transform={`translate(${cx - w / 2}, ${cy - h / 2})`}
      onClick={onClick}
      style={{ cursor: quizTarget ? 'pointer' : 'default' }}
      role={quizTarget ? 'button' : undefined}
      aria-label={quizTarget ? `Select ${label}` : undefined}
    >
      <rect width={w} height={h} rx="8" />
      <text x={w / 2} y={sublabel ? 18 : h / 2 + 5} className="node-label">{label}</text>
      {sublabel && <text x={w / 2} y={32} className="node-sublabel">{sublabel}</text>}
      {value && <text x={w / 2} y={h - 8} className="node-value">{value}</text>}
    </g>
  );
}

/**
 * The three horizontal buses drawn as labelled lines.
 */
function Buses() {
  // Bus line endpoints derived from layout constants
  const busLeft  = 60;
  const busRight = 840;

  const buses = [
    { y: 65,  type: 'address', label: 'Address Bus' },
    { y: 235, type: 'data',    label: 'Data Bus'    },
    { y: 380, type: 'control', label: 'Control Bus' },
  ];

  return (
    <g className="buses">
      {buses.map(({ y, type, label }) => (
        <g key={type}>
          <line
            x1={busLeft} y1={y}
            x2={busRight} y2={y}
            stroke={BUS_COLOURS[type]}
            strokeWidth="3"
            strokeDasharray="6 3"
          />
          {/* Arrowhead right */}
          <polygon
            points={`${busRight},${y - 5} ${busRight + 10},${y} ${busRight},${y + 5}`}
            fill={BUS_COLOURS[type]}
          />
          <text x={busLeft} y={y - 7} className="bus-label" fill={BUS_COLOURS[type]}>{label}</text>
        </g>
      ))}
    </g>
  );
}

/**
 * CpuDiagram renders the full SVG diagram.
 *
 * @param {Object}   props
 * @param {string[]} props.activeNodes   - IDs of components to highlight
 * @param {string}   props.phase         - current phase for colour theming
 * @param {Object}   props.registerValues - map of componentId → display string
 * @param {string[]} props.quizTargets   - IDs that are clickable in quiz mode
 * @param {string}   props.quizCorrect   - ID that flashed correct
 * @param {string}   props.quizWrong     - ID that flashed wrong
 * @param {Function} props.onNodeClick   - (id) => void — quiz click handler
 */
export default function CpuDiagram({
  activeNodes = [],
  phase = '',
  registerValues = {},
  quizTargets = [],
  quizCorrect = null,
  quizWrong = null,
  onNodeClick,
}) {
  const nodes = [
    { id: 'PC',  label: 'PC',  sublabel: 'Program Counter'      },
    { id: 'MAR', label: 'MAR', sublabel: 'Memory Address Reg'   },
    { id: 'MDR', label: 'MDR', sublabel: 'Memory Data Reg'      },
    { id: 'CIR', label: 'CIR', sublabel: 'Current Instr Reg'    },
    { id: 'CU',  label: 'CU',  sublabel: 'Control Unit'         },
    { id: 'ALU', label: 'ALU', sublabel: 'Arith/Logic Unit'     },
    { id: 'ACC', label: 'ACC', sublabel: 'Accumulator'          },
    { id: 'RAM', label: 'RAM', sublabel: 'Main Memory'          },
  ];

  return (
    <div className="diagram-wrapper">
      <svg
        viewBox="0 0 900 520"
        className={`cpu-diagram phase-${phase}`}
        aria-label="CPU Fetch-Decode-Execute Cycle Diagram"
      >
        {/* CPU enclosure box */}
        <rect
          x="40" y="10" width="620" height="500"
          className="cpu-enclosure"
          rx="12"
        />
        <text x="340" y="30" className="enclosure-label">CPU</text>

        {/* Cache note */}
        <rect x="55" y="42" width="160" height="30" rx="6" className="cache-badge" />
        <text x="135" y="62" className="cache-label">Cache (fast)</text>

        <Buses />

        {/* Component boxes */}
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

        {/* Vertical connector lines inside CPU (visual structure) */}
        {/* PC ↔ MAR */}
        <line x1={NODE_POSITIONS.PC.x}  y1={NODE_POSITIONS.PC.y  + NODE_SIZE.h / 2}
              x2={NODE_POSITIONS.MAR.x} y2={NODE_POSITIONS.MAR.y - NODE_SIZE.h / 2}
              className="internal-wire" />
        {/* MAR ↔ MDR */}
        <line x1={NODE_POSITIONS.MAR.x} y1={NODE_POSITIONS.MAR.y + NODE_SIZE.h / 2}
              x2={NODE_POSITIONS.MDR.x} y2={NODE_POSITIONS.MDR.y - NODE_SIZE.h / 2}
              className="internal-wire" />
        {/* MDR ↔ CIR */}
        <line x1={NODE_POSITIONS.MDR.x} y1={NODE_POSITIONS.MDR.y + NODE_SIZE.h / 2}
              x2={NODE_POSITIONS.CIR.x} y2={NODE_POSITIONS.CIR.y - NODE_SIZE.h / 2}
              className="internal-wire" />
        {/* CU ↔ ALU */}
        <line x1={NODE_POSITIONS.CU.x}  y1={NODE_POSITIONS.CU.y  + NODE_SIZE.h / 2}
              x2={NODE_POSITIONS.ALU.x} y2={NODE_POSITIONS.ALU.y - NODE_SIZE.h / 2}
              className="internal-wire" />
        {/* ALU ↔ ACC */}
        <line x1={NODE_POSITIONS.ALU.x} y1={NODE_POSITIONS.ALU.y + NODE_SIZE.h / 2}
              x2={NODE_POSITIONS.ACC.x} y2={NODE_POSITIONS.ACC.y - NODE_SIZE.h / 2}
              className="internal-wire" />
        {/* CIR ↔ CU (horizontal) */}
        <line x1={NODE_POSITIONS.CIR.x + NODE_SIZE.w / 2} y1={NODE_POSITIONS.CIR.y}
              x2={NODE_POSITIONS.CU.x  - NODE_SIZE.w / 2} y2={NODE_POSITIONS.CU.y}
              className="internal-wire" />
        {/* MDR ↔ ACC (horizontal data path) */}
        <line x1={NODE_POSITIONS.MDR.x + NODE_SIZE.w / 2} y1={NODE_POSITIONS.MDR.y}
              x2={NODE_POSITIONS.ACC.x - NODE_SIZE.w / 2}  y2={NODE_POSITIONS.ACC.y}
              className="internal-wire" />
        {/* MDR ↔ ALU */}
        <line x1={NODE_POSITIONS.MDR.x + NODE_SIZE.w / 2} y1={NODE_POSITIONS.MDR.y}
              x2={NODE_POSITIONS.ALU.x - NODE_SIZE.w / 2}  y2={NODE_POSITIONS.ALU.y}
              className="internal-wire" />

        {/* Bus drop lines — vertical stubs from each component to its bus */}
        {[
          { id: 'PC',  busY: 65  },
          { id: 'MAR', busY: 65  },
          { id: 'MAR', busY: 235 },
          { id: 'MDR', busY: 235 },
          { id: 'CU',  busY: 380 },
          { id: 'RAM', busY: 65  },
          { id: 'RAM', busY: 235 },
          { id: 'RAM', busY: 380 },
        ].map(({ id, busY }, i) => (
          <line key={i}
            x1={NODE_POSITIONS[id].x} y1={NODE_POSITIONS[id].y - NODE_SIZE.h / 2}
            x2={NODE_POSITIONS[id].x} y2={busY}
            className="bus-drop"
          />
        ))}
      </svg>
    </div>
  );
}
