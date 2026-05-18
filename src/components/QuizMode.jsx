/**
 * @fileoverview QuizMode — interactive click-on-diagram quiz.
 *
 * The student is shown the current state of the CPU and must click the NEXT
 * component the signal/data flows to. Correct → brief green flash + encouragement.
 * Wrong → brief red flash + gentle explanation of the correct path, then retry.
 * Score and completion summary shown at the end.
 */

import { useState, useEffect, useCallback } from 'react';
import { cycleSteps } from '../data/cycleSteps.js';
import { CpuDiagramSVGContent } from './DemoMode.jsx';
import SparkLayer from './SparkLayer.jsx';
import { NODE_POSITIONS, NODE_SIZE } from '../data/nodePositions.js';

const PHASE_LABELS = { fetch: 'FETCH', decode: 'DECODE', execute: 'EXECUTE' };

/** After a correct/wrong answer, how long (ms) before advancing */
const FEEDBACK_DELAY = 1600;

/**
 * For each step, the "quiz target" is the LAST node in sparkPath — the
 * destination the student must identify.
 */
function getTargetNode(step) {
  return step.sparkPath[step.sparkPath.length - 1];
}

/** All unique node IDs so we can offer them as clickable targets */
const ALL_NODES = Object.keys(NODE_POSITIONS);

/** Accumulate register values up to a step index */
function buildRegValues(upToIndex) {
  const vals = {};
  for (let i = 0; i <= upToIndex; i++) {
    const s = cycleSteps[i];
    if (s?.registerUpdate) {
      const matches = s.registerUpdate.match(/(\w+)\s*=\s*([^,\n]+)/g) || [];
      matches.forEach((m) => {
        const [, reg, val] = m.match(/(\w+)\s*=\s*(.+)/);
        if (NODE_POSITIONS[reg]) vals[reg] = val.trim();
      });
    }
  }
  return vals;
}

/**
 * @param {Object}   props
 * @param {Function} props.onSwitchToDemo — callback to return to demo mode
 */
export default function QuizMode({ onSwitchToDemo }) {
  const [stepIndex,    setStepIndex]    = useState(0);
  const [feedback,     setFeedback]     = useState(null);   // null | 'correct' | 'wrong'
  const [wrongGuess,   setWrongGuess]   = useState(null);   // ID of the wrong node clicked
  const [score,        setScore]        = useState(0);
  const [attempts,     setAttempts]     = useState(0);      // wrong attempts on this step
  const [totalWrong,   setTotalWrong]   = useState(0);
  const [sparkKey,     setSparkKey]     = useState('quiz-init');
  const [done,         setDone]         = useState(false);
  const [showTarget,   setShowTarget]   = useState(false);  // hint after 2 wrong

  const step       = cycleSteps[stepIndex];
  const target     = getTargetNode(step);
  const regValues  = buildRegValues(stepIndex);
  const isLastStep = stepIndex === cycleSteps.length - 1;

  // Source nodes (already-visited in this step) highlighted without interaction
  const sourceNodes = step.sparkPath.slice(0, -1);

  /** Handle a node click from the diagram */
  const handleNodeClick = useCallback((id) => {
    if (feedback) return; // debounce during feedback animation

    setAttempts((a) => a + 1);

    if (id === target) {
      setFeedback('correct');
      setScore((s) => s + 1);
      setSparkKey(`quiz-correct-${stepIndex}-${Date.now()}`);

      setTimeout(() => {
        setFeedback(null);
        setWrongGuess(null);
        setAttempts(0);
        setShowTarget(false);
        if (isLastStep) {
          setDone(true);
        } else {
          setStepIndex((i) => i + 1);
        }
      }, FEEDBACK_DELAY);
    } else {
      setTotalWrong((w) => w + 1);
      setWrongGuess(id);
      setFeedback('wrong');
      if (attempts + 1 >= 2) setShowTarget(true); // reveal after 2 wrong
      // Wrong feedback stays until the student dismisses it via the button
    }
  }, [feedback, target, stepIndex, isLastStep, attempts]);

  if (done) {
    return (
      <CompletionScreen
        score={score}
        total={cycleSteps.length}
        totalWrong={totalWrong}
        onRetry={() => {
          setStepIndex(0); setScore(0); setTotalWrong(0);
          setAttempts(0); setShowTarget(false);
          setFeedback(null); setDone(false);
        }}
        onDemo={onSwitchToDemo}
      />
    );
  }

  const wrongMessage = wrongGuess
    ? getWrongMessage(step, wrongGuess, target)
    : null;

  return (
    <div className="mode-layout">
      {/* Left: diagram */}
      <div className="diagram-pane">
        <svg viewBox="0 0 960 460" className={`cpu-diagram phase-${step.phase}`}
          aria-label="CPU quiz diagram">

          <CpuDiagramSVGContent
            activeNodes={sourceNodes}
            registerValues={regValues}
            quizTargets={feedback ? [] : ALL_NODES}
            quizCorrect={feedback === 'correct' ? target : null}
            quizWrong={feedback === 'wrong' ? wrongGuess : null}
            onNodeClick={handleNodeClick}
          />

          {feedback === 'correct' && (
            <SparkLayer
              sparkPath={step.sparkPath}
              busType={step.busType}
              sparkKey={sparkKey}
              duration={900}
            />
          )}
        </svg>
      </div>

      {/* Right: quiz panel */}
      <div className="info-pane">
        {/* Score */}
        <div className="quiz-score">
          Score: <strong>{score}</strong> / {cycleSteps.length}
        </div>

        {/* Phase badge */}
        <div className="badges">
          <span className={`badge badge--${step.phase}`}>{PHASE_LABELS[step.phase]}</span>
          <span className="badge badge--instruction">{step.instruction}</span>
        </div>

        {/* Question */}
        <h2 className="step-title quiz-question">
          {step.title.split('—')[0]} —&nbsp;
          <em>Where does the signal go next?</em>
        </h2>

        <p className="step-explanation quiz-context">
          {getStepContext(step)}
        </p>

        {/* Hint after 2 wrong answers */}
        {showTarget && (
          <div className="quiz-hint">
            💡 Hint: try clicking <strong>{target}</strong>
          </div>
        )}

        {/* Feedback message */}
        {feedback === 'correct' && (
          <div className="feedback feedback--correct">
            ✓ Correct! {getCorrectMessage(step)}
          </div>
        )}
        {feedback === 'wrong' && wrongMessage && (
          <div className="feedback feedback--wrong">
            <p>{wrongMessage}</p>
            <button
              className="btn btn--dismiss"
              onClick={() => { setFeedback(null); setWrongGuess(null); }}
            >
              Got it — try again
            </button>
          </div>
        )}

        {/* Step explanation shown after correct */}
        {feedback === 'correct' && (
          <p className="step-explanation">{step.explanation}</p>
        )}

        <button className="btn btn--secondary" onClick={onSwitchToDemo} style={{ marginTop: '1.5rem' }}>
          ← Back to Demo
        </button>
      </div>
    </div>
  );
}

/** Short context sentence shown as the quiz question prompt */
function getStepContext(step) {
  const sourceNode = step.sparkPath[step.sparkPath.length - 2] || step.sparkPath[0];
  const contextMap = {
    fetch:   `We are in the FETCH phase, retrieving the instruction "${step.instruction}" from memory.`,
    decode:  `We are in the DECODE phase. The CIR holds "${step.instruction}".`,
    execute: `We are in the EXECUTE phase, carrying out "${step.instruction}".`,
  };
  return `${contextMap[step.phase]} The signal/data has just left the ${sourceNode}. Click the component it travels to next.`;
}

/** Encouraging message for a correct click */
function getCorrectMessage(step) {
  const msgs = [
    'Great work — you identified the correct path!',
    'Exactly right — well done!',
    'Spot on! You\'re mastering the FDE cycle.',
    'Perfect — that\'s the correct route for this signal.',
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/** Gentle correction message for a wrong click */
function getWrongMessage(step, wrongId, correctId) {
  const explanations = {
    PC_MAR:   `The PC sends its address to the MAR (Memory Address Register), not directly to ${wrongId}. The MAR is the gateway for all memory addresses.`,
    MAR_RAM:  `The MAR's address goes to RAM, not to ${wrongId}. Only RAM can respond to an address lookup.`,
    RAM_MDR:  `RAM returns data to the MDR (Memory Data Register), not to ${wrongId}. The MDR buffers everything coming from memory.`,
    MDR_CIR:  `During fetch, the instruction moves from the MDR to the CIR (Current Instruction Register), not to ${wrongId}.`,
    CIR_CU:   `The CU reads the instruction from the CIR to decode it — it doesn't come from ${wrongId} at this point.`,
    MDR_ALU:  `The data value from the MDR goes to the ALU for arithmetic, not to ${wrongId}.`,
    ALU_ACC:  `The ALU sends its result to the Accumulator, not to ${wrongId}.`,
    MDR_ACC:  `For a LOAD, the data from MDR goes straight to the Accumulator, not to ${wrongId}.`,
    ACC_MDR:  `To STORE, the Accumulator value moves to the MDR first (ready for writing), not to ${wrongId}.`,
    MDR_RAM:  `The MDR's value is written to RAM (main memory) during a STORE — not to ${wrongId}.`,
  };

  const pathKey = `${step.sparkPath[step.sparkPath.length - 2]}_${correctId}`;
  return (
    explanations[pathKey] ||
    `Not quite — ${wrongId} isn't the next destination here. The correct answer is ${correctId}. ${step.explanation}`
  );
}

/** End-of-quiz completion screen */
function CompletionScreen({ score, total, totalWrong, onRetry, onDemo }) {
  const pct = Math.round((score / total) * 100);
  let grade, colour;
  if (pct >= 90)      { grade = 'Excellent!';    colour = 'var(--phase-execute)'; }
  else if (pct >= 70) { grade = 'Good work!';    colour = 'var(--phase-decode)';  }
  else if (pct >= 50) { grade = 'Keep practising'; colour = 'var(--bus-address)'; }
  else                { grade = 'Review the demo and try again'; colour = 'var(--colour-accent)'; }

  return (
    <div className="completion-screen">
      <h2 className="completion-title">Quiz Complete!</h2>
      <div className="completion-score" style={{ color: colour }}>
        {score} / {total}
      </div>
      <div className="completion-pct">{pct}% — {grade}</div>
      <p className="completion-detail">
        You answered {score} steps correctly first time, with {totalWrong} incorrect {totalWrong === 1 ? 'attempt' : 'attempts'} in total.
      </p>
      <div className="completion-actions">
        <button className="btn btn--primary" onClick={onRetry}>Try Again</button>
        <button className="btn btn--secondary" onClick={onDemo}>Back to Demo</button>
      </div>
    </div>
  );
}
