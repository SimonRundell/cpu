/**
 * @fileoverview FDE Cycle step definitions.
 *
 * Each step describes one micro-operation in the Fetch-Decode-Execute cycle.
 * The demo program runs four pseudo-assembly instructions:
 *   LOAD  5    — load the value at memory address 5 into the Accumulator
 *   ADD   6    — add the value at memory address 6 to the Accumulator
 *   STORE 7    — store the Accumulator value into memory address 7
 *   HALT       — stop execution
 *
 * @typedef {Object} CycleStep
 * @property {string}   id          — unique identifier
 * @property {string}   phase       — 'fetch' | 'decode' | 'execute'
 * @property {string}   instruction — which instruction this step belongs to
 * @property {string[]} activeNodes — component IDs highlighted during this step
 * @property {string[]} sparkPath   — ordered list of node IDs the spark travels
 * @property {string}   busType     — 'address' | 'data' | 'control' | null
 * @property {string}   title       — short step title
 * @property {string}   explanation — teacher-facing explanation shown in the panel
 * @property {string}   registerUpdate — optional: "REGISTER=value" shown on diagram
 */

export const COMPONENTS = {
  PC:  'PC',
  MAR: 'MAR',
  MDR: 'MDR',
  CIR: 'CIR',
  ACC: 'ACC',
  ALU: 'ALU',
  CU:  'CU',
  RAM: 'RAM',
};

/** Memory contents for the demo program */
export const MEMORY = {
  0: 'LOAD 5',
  1: 'ADD 6',
  2: 'STORE 7',
  3: 'HALT',
  5: 42,
  6: 10,
  7: null,
};

export const INSTRUCTIONS = [
  { label: 'LOAD 5',  addr: 0 },
  { label: 'ADD 6',   addr: 1 },
  { label: 'STORE 7', addr: 2 },
  { label: 'HALT',    addr: 3 },
];

export const cycleSteps = [
  /* ─────────────── INSTRUCTION 1: LOAD 5 ─────────────── */

  // FETCH
  {
    id: 'f1a',
    phase: 'fetch',
    instruction: 'LOAD 5',
    activeNodes: ['PC', 'MAR'],
    sparkPath: ['PC', 'MAR'],
    busType: 'address',
    title: 'F1 — PC → MAR',
    explanation:
      'The Program Counter (PC) holds the address of the next instruction — currently address 0. ' +
      'The CU copies this address into the Memory Address Register (MAR) via the Address Bus. ' +
      'The PC then increments to 1, ready for the next instruction.',
    registerUpdate: 'PC=0 → MAR=0, PC→1',
  },
  {
    id: 'f1b',
    phase: 'fetch',
    instruction: 'LOAD 5',
    activeNodes: ['MAR', 'RAM', 'MDR'],
    sparkPath: ['MAR', 'RAM', 'MDR'],
    busType: 'data',
    title: 'F2 — MAR → RAM → MDR',
    explanation:
      'The address in the MAR (0) is sent along the Address Bus to RAM. ' +
      'RAM looks up location 0 and sends the instruction stored there — "LOAD 5" — back along the Data Bus into the Memory Data Register (MDR). ' +
      'Notice this journey to RAM takes time. Modern CPUs keep recently-used data in a much faster Cache memory to avoid waiting for RAM every time.',
    registerUpdate: 'RAM[0] = "LOAD 5" → MDR',
  },
  {
    id: 'f1c',
    phase: 'fetch',
    instruction: 'LOAD 5',
    activeNodes: ['MDR', 'CIR'],
    sparkPath: ['MDR', 'CIR'],
    busType: 'data',
    title: 'F3 — MDR → CIR',
    explanation:
      'The instruction held in the MDR is copied into the Current Instruction Register (CIR). ' +
      'The MDR is now free to be used for the next memory transfer while the CIR holds our instruction safely.',
    registerUpdate: 'MDR → CIR = "LOAD 5"',
  },

  // DECODE
  {
    id: 'd1',
    phase: 'decode',
    instruction: 'LOAD 5',
    activeNodes: ['CIR', 'CU'],
    sparkPath: ['CIR', 'CU'],
    busType: 'control',
    title: 'D1 — CIR → CU (Decode)',
    explanation:
      'The Control Unit (CU) reads the instruction in the CIR and decodes it. ' +
      'It splits the instruction into the opcode (LOAD) and the operand (address 5). ' +
      'The CU then sends control signals to the correct components to carry out the instruction.',
    registerUpdate: 'CU decodes: opcode=LOAD, operand=5',
  },

  // EXECUTE
  {
    id: 'e1a',
    phase: 'execute',
    instruction: 'LOAD 5',
    activeNodes: ['CU', 'MAR'],
    sparkPath: ['CU', 'MAR'],
    busType: 'control',
    title: 'E1a — CU → MAR (address 5)',
    explanation:
      'The CU instructs the MAR to load the operand address — 5. ' +
      'This tells the memory system which location we want to read data from.',
    registerUpdate: 'MAR = 5',
  },
  {
    id: 'e1b',
    phase: 'execute',
    instruction: 'LOAD 5',
    activeNodes: ['MAR', 'RAM', 'MDR'],
    sparkPath: ['MAR', 'RAM', 'MDR'],
    busType: 'data',
    title: 'E1b — RAM[5] → MDR',
    explanation:
      'The address 5 is placed on the Address Bus. RAM retrieves the value stored at location 5 — the number 42 — and returns it via the Data Bus into the MDR. ' +
      'If this value had been accessed recently, the CPU Cache would have served it instantly, saving the slower trip to RAM.',
    registerUpdate: 'RAM[5] = 42 → MDR',
  },
  {
    id: 'e1c',
    phase: 'execute',
    instruction: 'LOAD 5',
    activeNodes: ['MDR', 'ACC'],
    sparkPath: ['MDR', 'ACC'],
    busType: 'data',
    title: 'E1c — MDR → ACC',
    explanation:
      'The value from the MDR (42) is loaded into the Accumulator (ACC). ' +
      'The Accumulator is the ALU\'s working register — it holds the current result of any arithmetic or logic operation.',
    registerUpdate: 'ACC = 42',
  },

  /* ─────────────── INSTRUCTION 2: ADD 6 ─────────────── */

  // FETCH
  {
    id: 'f2a',
    phase: 'fetch',
    instruction: 'ADD 6',
    activeNodes: ['PC', 'MAR'],
    sparkPath: ['PC', 'MAR'],
    busType: 'address',
    title: 'F1 — PC → MAR',
    explanation:
      'The PC now holds address 1. The CU copies it to the MAR and increments the PC to 2.',
    registerUpdate: 'PC=1 → MAR=1, PC→2',
  },
  {
    id: 'f2b',
    phase: 'fetch',
    instruction: 'ADD 6',
    activeNodes: ['MAR', 'RAM', 'MDR'],
    sparkPath: ['MAR', 'RAM', 'MDR'],
    busType: 'data',
    title: 'F2 — RAM[1] → MDR',
    explanation:
      'RAM returns the instruction at address 1 — "ADD 6" — into the MDR via the Data Bus.',
    registerUpdate: 'RAM[1] = "ADD 6" → MDR',
  },
  {
    id: 'f2c',
    phase: 'fetch',
    instruction: 'ADD 6',
    activeNodes: ['MDR', 'CIR'],
    sparkPath: ['MDR', 'CIR'],
    busType: 'data',
    title: 'F3 — MDR → CIR',
    explanation: 'The instruction "ADD 6" moves from the MDR into the CIR, ready for decoding.',
    registerUpdate: 'CIR = "ADD 6"',
  },

  // DECODE
  {
    id: 'd2',
    phase: 'decode',
    instruction: 'ADD 6',
    activeNodes: ['CIR', 'CU'],
    sparkPath: ['CIR', 'CU'],
    busType: 'control',
    title: 'D1 — CU Decodes ADD 6',
    explanation:
      'The CU decodes "ADD 6": opcode = ADD, operand = address 6. ' +
      'It will need to fetch the value at address 6 and add it to the Accumulator.',
    registerUpdate: 'CU decodes: opcode=ADD, operand=6',
  },

  // EXECUTE
  {
    id: 'e2a',
    phase: 'execute',
    instruction: 'ADD 6',
    activeNodes: ['CU', 'MAR'],
    sparkPath: ['CU', 'MAR'],
    busType: 'control',
    title: 'E1a — CU → MAR (address 6)',
    explanation: 'The CU sets the MAR to operand address 6.',
    registerUpdate: 'MAR = 6',
  },
  {
    id: 'e2b',
    phase: 'execute',
    instruction: 'ADD 6',
    activeNodes: ['MAR', 'RAM', 'MDR'],
    sparkPath: ['MAR', 'RAM', 'MDR'],
    busType: 'data',
    title: 'E1b — RAM[6] → MDR',
    explanation:
      'RAM returns the value at address 6 — the number 10 — into the MDR.',
    registerUpdate: 'RAM[6] = 10 → MDR',
  },
  {
    id: 'e2c',
    phase: 'execute',
    instruction: 'ADD 6',
    activeNodes: ['MDR', 'ALU', 'ACC'],
    sparkPath: ['MDR', 'ALU', 'ACC'],
    busType: 'data',
    title: 'E1c — ALU adds MDR to ACC',
    explanation:
      'The ALU receives both the value in the MDR (10) and the current Accumulator value (42). ' +
      'It adds them together and stores the result (52) back in the Accumulator.',
    registerUpdate: 'ALU: 42 + 10 = 52 → ACC',
  },

  /* ─────────────── INSTRUCTION 3: STORE 7 ─────────────── */

  // FETCH
  {
    id: 'f3a',
    phase: 'fetch',
    instruction: 'STORE 7',
    activeNodes: ['PC', 'MAR'],
    sparkPath: ['PC', 'MAR'],
    busType: 'address',
    title: 'F1 — PC → MAR',
    explanation: 'PC holds address 2. It copies to MAR and increments to 3.',
    registerUpdate: 'PC=2 → MAR=2, PC→3',
  },
  {
    id: 'f3b',
    phase: 'fetch',
    instruction: 'STORE 7',
    activeNodes: ['MAR', 'RAM', 'MDR'],
    sparkPath: ['MAR', 'RAM', 'MDR'],
    busType: 'data',
    title: 'F2 — RAM[2] → MDR',
    explanation: 'RAM returns "STORE 7" from address 2 into the MDR.',
    registerUpdate: 'RAM[2] = "STORE 7" → MDR',
  },
  {
    id: 'f3c',
    phase: 'fetch',
    instruction: 'STORE 7',
    activeNodes: ['MDR', 'CIR'],
    sparkPath: ['MDR', 'CIR'],
    busType: 'data',
    title: 'F3 — MDR → CIR',
    explanation: '"STORE 7" moves to the CIR.',
    registerUpdate: 'CIR = "STORE 7"',
  },

  // DECODE
  {
    id: 'd3',
    phase: 'decode',
    instruction: 'STORE 7',
    activeNodes: ['CIR', 'CU'],
    sparkPath: ['CIR', 'CU'],
    busType: 'control',
    title: 'D1 — CU Decodes STORE 7',
    explanation:
      'The CU decodes "STORE 7": opcode = STORE, operand = address 7. ' +
      'It will write the current Accumulator value into RAM at address 7.',
    registerUpdate: 'CU decodes: opcode=STORE, operand=7',
  },

  // EXECUTE
  {
    id: 'e3a',
    phase: 'execute',
    instruction: 'STORE 7',
    activeNodes: ['CU', 'MAR'],
    sparkPath: ['CU', 'MAR'],
    busType: 'control',
    title: 'E1a — CU → MAR (address 7)',
    explanation: 'The CU sets the MAR to the destination address — 7.',
    registerUpdate: 'MAR = 7',
  },
  {
    id: 'e3b',
    phase: 'execute',
    instruction: 'STORE 7',
    activeNodes: ['ACC', 'MDR'],
    sparkPath: ['ACC', 'MDR'],
    busType: 'data',
    title: 'E1b — ACC → MDR',
    explanation:
      'The Accumulator value (52) is copied into the MDR, ready to be written to memory.',
    registerUpdate: 'MDR = 52',
  },
  {
    id: 'e3c',
    phase: 'execute',
    instruction: 'STORE 7',
    activeNodes: ['MDR', 'MAR', 'RAM'],
    sparkPath: ['MDR', 'RAM'],
    busType: 'data',
    title: 'E1c — MDR → RAM[7]',
    explanation:
      'The CU sends a write signal. The value in the MDR (52) is written to RAM at the address held in the MAR (7). ' +
      'The result of our calculation is now stored in memory.',
    registerUpdate: 'RAM[7] = 52',
  },

  /* ─────────────── INSTRUCTION 4: HALT ─────────────── */

  // FETCH
  {
    id: 'f4a',
    phase: 'fetch',
    instruction: 'HALT',
    activeNodes: ['PC', 'MAR'],
    sparkPath: ['PC', 'MAR'],
    busType: 'address',
    title: 'F1 — PC → MAR',
    explanation: 'PC holds address 3. It copies to MAR and increments to 4.',
    registerUpdate: 'PC=3 → MAR=3, PC→4',
  },
  {
    id: 'f4b',
    phase: 'fetch',
    instruction: 'HALT',
    activeNodes: ['MAR', 'RAM', 'MDR'],
    sparkPath: ['MAR', 'RAM', 'MDR'],
    busType: 'data',
    title: 'F2 — RAM[3] → MDR',
    explanation: 'RAM returns "HALT" from address 3 into the MDR.',
    registerUpdate: 'RAM[3] = "HALT" → MDR',
  },
  {
    id: 'f4c',
    phase: 'fetch',
    instruction: 'HALT',
    activeNodes: ['MDR', 'CIR'],
    sparkPath: ['MDR', 'CIR'],
    busType: 'data',
    title: 'F3 — MDR → CIR',
    explanation: '"HALT" moves to the CIR.',
    registerUpdate: 'CIR = "HALT"',
  },

  // DECODE
  {
    id: 'd4',
    phase: 'decode',
    instruction: 'HALT',
    activeNodes: ['CIR', 'CU'],
    sparkPath: ['CIR', 'CU'],
    busType: 'control',
    title: 'D1 — CU Decodes HALT',
    explanation: 'The CU decodes the HALT instruction — no operand needed.',
    registerUpdate: 'CU decodes: opcode=HALT',
  },

  // EXECUTE
  {
    id: 'e4',
    phase: 'execute',
    instruction: 'HALT',
    activeNodes: ['CU'],
    sparkPath: ['CU'],
    busType: 'control',
    title: 'E1 — HALT: execution stops',
    explanation:
      'The CU sends a halt signal. The clock stops cycling and the CPU ceases fetching new instructions. ' +
      'The program has completed successfully — the result (52) is sitting in RAM at address 7.',
    registerUpdate: 'HALT — CPU stopped',
  },
];

/**
 * Returns the steps for a single instruction (fetch + decode + execute).
 * @param {string} instruction
 * @returns {CycleStep[]}
 */
export function getStepsForInstruction(instruction) {
  return cycleSteps.filter((s) => s.instruction === instruction);
}
