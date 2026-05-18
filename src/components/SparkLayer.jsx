/**
 * @fileoverview SparkLayer — animates a glowing dot travelling between CPU nodes.
 *
 * The spark does NOT travel in straight diagonals between component centres.
 * For cross-column connections it routes via the appropriate bus line:
 *   1. Drop vertically from the source centre to the bus y-coordinate.
 *   2. Travel horizontally along the bus to the destination x-coordinate.
 *   3. Rise vertically from the bus to the destination centre.
 *
 * Same-column connections (e.g. PC→MAR, CU→ALU) are drawn as direct
 * vertical lines since those are internal register transfers, not bus operations.
 */

import { useEffect, useRef } from 'react';
import { NODE_POSITIONS } from '../data/nodePositions.js';

/** y-coordinate of each bus line — must match DemoMode.jsx */
const BUS_Y = { address: 108, data: 226, control: 344 };

/** Colour per bus type */
const SPARK_COLOUR = {
  address: 'var(--bus-address)',
  data:    'var(--bus-data)',
  control: 'var(--bus-control)',
};

/**
 * Builds the polyline waypoints for the spark, routing via the bus when nodes
 * are in different columns.
 *
 * @param {string[]} sparkPath - ordered component IDs
 * @param {string|null} busType - which bus carries this signal
 * @returns {Array<[number,number]>}
 */
function buildRoutedPoints(sparkPath, busType) {
  const busY = busType ? BUS_Y[busType] : null;
  const pts = [];

  for (let i = 0; i < sparkPath.length; i++) {
    const id = sparkPath[i];
    if (!NODE_POSITIONS[id]) continue;
    const { x, y } = NODE_POSITIONS[id];

    if (i === 0) {
      pts.push([x, y]);
      continue;
    }

    const prevId = sparkPath[i - 1];
    if (!NODE_POSITIONS[prevId]) { pts.push([x, y]); continue; }
    const prev = NODE_POSITIONS[prevId];

    // Same column (internal transfer) — straight line, no bus routing needed
    const sameColumn = Math.abs(prev.x - x) < 60;

    if (busY && !sameColumn) {
      // Drop/rise from previous centre to bus level
      pts.push([prev.x, busY]);
      // Travel along bus to destination column
      pts.push([x, busY]);
    }

    pts.push([x, y]);
  }

  return pts;
}

/**
 * Total length of a polyline through [x,y] pairs.
 * @param {Array<[number,number]>} pts
 * @returns {number}
 */
function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

/**
 * Interpolates a point at distance d along the polyline.
 * @param {Array<[number,number]>} pts
 * @param {number} d
 * @returns {[number,number]}
 */
function pointAtDistance(pts, d) {
  let remaining = d;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    const seg = Math.sqrt(dx * dx + dy * dy);
    if (remaining <= seg) {
      const t = remaining / seg;
      return [pts[i - 1][0] + dx * t, pts[i - 1][1] + dy * t];
    }
    remaining -= seg;
  }
  return pts[pts.length - 1];
}

/**
 * @param {Object}   props
 * @param {string[]} props.sparkPath  - ordered component IDs
 * @param {string}   props.busType    - 'address' | 'data' | 'control' | null
 * @param {string}   props.sparkKey   - change to re-trigger animation
 * @param {number}   [props.duration] - ms (default 1000)
 */
export default function SparkLayer({ sparkPath = [], busType = null, sparkKey = '', duration = 1000 }) {
  const animRef = useRef(null);
  const pts = buildRoutedPoints(sparkPath, busType);

  // Restart animation whenever sparkKey changes
  useEffect(() => {
    if (!animRef.current || pts.length < 2) return;
    animRef.current.style.animation = 'none';
    void animRef.current.offsetWidth;
    animRef.current.style.animation = '';
  }, [sparkKey]);

  if (pts.length < 2) return null;

  const totalLen  = polylineLength(pts);
  const STEPS     = 50;
  const colour    = SPARK_COLOUR[busType] || 'var(--colour-accent)';
  const frameId   = `spark-${sparkKey.replace(/[^a-z0-9]/gi, '_')}`;

  const keyframeCSS = Array.from({ length: STEPS + 1 }, (_, i) => {
    const d = (i / STEPS) * totalLen;
    const [x, y] = pointAtDistance(pts, d);
    return `${((i / STEPS) * 100).toFixed(1)}% { transform: translate(${x.toFixed(1)}px,${y.toFixed(1)}px); }`;
  }).join('\n');

  const polylinePoints = pts.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <g className="spark-layer">
      <defs>
        <style>{`
          @keyframes ${frameId} { ${keyframeCSS} }
          .spark-dot-${frameId} {
            animation: ${frameId} ${duration}ms ease-in-out forwards;
            transform-origin: 0 0;
          }
        `}</style>
        <filter id="spark-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Faint travel trail showing the bus route */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={colour}
        strokeWidth="2"
        strokeDasharray="5 7"
        opacity="0.4"
      />

      {/* Animated spark dot */}
      <circle
        ref={animRef}
        className={`spark-dot spark-dot-${frameId}`}
        cx="0" cy="0" r="8"
        fill={colour}
        filter="url(#spark-glow)"
        opacity="0.95"
      />
    </g>
  );
}
