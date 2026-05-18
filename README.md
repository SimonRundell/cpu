# Fetch–Decode–Execute Cycle Teaching Aid

An interactive, browser-based teaching aid that visualises the **Fetch–Decode–Execute (FDE) Cycle** of a CPU — built for T-Level Digital (Software Design) students and appropriate for BTEC Level 3 Computing and similar post-16 qualifications.

Live at: **[cpu.toolsforteaching.co.uk](https://cpu.toolsforteaching.co.uk)**

---

## Contents

1. [What It Does](#what-it-does)
2. [Demo Mode](#demo-mode)
3. [Quiz Mode](#quiz-mode)
4. [The Demo Program](#the-demo-program)
5. [Components Illustrated](#components-illustrated)
6. [Teaching Notes](#teaching-notes)
7. [Running Locally](#running-locally)
8. [Project Structure](#project-structure)
9. [Extending the App](#extending-the-app)
10. [License](#license)

---

## What It Does

The app shows how a CPU steps through the FDE cycle for a short sequence of pseudo-assembly instructions. Every micro-operation — the transfer of an address, the retrieval of data from RAM, the decoding of an opcode — is shown as a live **animated spark** travelling between CPU components, along colour-coded buses.

Two modes are available:

| Mode | Purpose |
|------|---------|
| **Demo** | Teacher-led walkthrough — step forward, back, auto-play |
| **Quiz** | Student clicks the diagram to choose the next destination |

Light and dark themes are provided; the choice is remembered between sessions.

---

## Demo Mode

The teacher (or student) steps through 27 micro-operations across four instructions:

- **Previous / Next** — manual step control
- **▶ Play / ⏸ Pause** — auto-advances every 2.8 seconds
- **↺ Reset** — returns to step 1

Each step shows:
- A **phase badge** (blue = FETCH, amber = DECODE, green = EXECUTE)
- The **current instruction** being processed
- A **step title** identifying which registers are involved
- A **plain-English explanation** of what is happening and why
- A **register update** line showing the value transferred, in `Courier New`
- A **progress bar** across all 27 steps

The spark changes colour depending on the bus carrying the signal:

| Bus | Colour | Carries |
|-----|--------|---------|
| Address Bus | Purple | Memory addresses |
| Data Bus | Pink/Red | Instructions and data values |
| Control Bus | Cyan | Control signals from the CU |

---

## Quiz Mode

All CPU component boxes pulse with an animated ring. The student must click the component that the signal or data travels to **next**.

- **Correct answer** → green flash, an encouraging message, full step explanation shown
- **Wrong answer** → red flash, a specific correction explaining *why* that component is not next
- After **two wrong attempts** on the same step, a hint reveals the correct component name
- At the end, a **score screen** shows: correct count, total wrong attempts, percentage, and a grade

Grades:

| Score | Grade |
|-------|-------|
| 90%+ | Excellent! |
| 70–89% | Good work! |
| 50–69% | Keep practising |
| Below 50% | Review the demo and try again |

---

## The Demo Program

The app executes four pseudo-assembly instructions. The mnemonics are kept close to real assembler style while remaining readable to students who have not studied assembly language.

```
Address  Instruction   Meaning
──────────────────────────────────────────────────────
  0      LOAD 5        Load the value at memory address 5 into the Accumulator
  1      ADD  6        Add the value at memory address 6 to the Accumulator
  2      STORE 7       Write the Accumulator value into memory address 7
  3      HALT          Stop execution
```

Data memory:

```
Address  Value
──────────────
  5      42
  6      10
  7      (empty — result written here: 52)
```

After execution, `RAM[7] = 52` (42 + 10).

---

## Components Illustrated

| Component | Full Name | Role |
|-----------|-----------|------|
| **PC** | Program Counter | Holds the address of the next instruction to fetch |
| **MAR** | Memory Address Register | Holds the address currently being accessed on the Address Bus |
| **MDR** | Memory Data Register | Buffers data moving to or from RAM on the Data Bus |
| **CIR** | Current Instruction Register | Holds the instruction being decoded and executed |
| **CU** | Control Unit | Decodes instructions and sends control signals to all other components |
| **ALU** | Arithmetic/Logic Unit | Performs arithmetic (+, −, ×, ÷) and logical (AND, OR, NOT) operations |
| **ACC** | Accumulator | The ALU's primary working register; holds the current result |
| **RAM** | Main Memory | Stores both program instructions and data; slower than the CPU's registers |
| **Cache** | (shown as a badge) | Fast on-chip memory; reduces trips to RAM for recently-used data |
| **Address Bus** | (purple dashed line) | One-directional — carries addresses from CPU to RAM |
| **Data Bus** | (pink dashed line) | Bi-directional — carries instructions and data between CPU and RAM |
| **Control Bus** | (cyan dashed line) | Carries read/write signals and clock pulses from the CU |

---

## Teaching Notes

### Curriculum alignment

This resource supports the following areas of the T-Level Digital (Software Design) and BTEC Level 3 Computing specifications:

- Architecture of the CPU: von Neumann model, stored program concept
- Roles of the PC, MAR, MDR, CIR, CU, ALU, and Accumulator
- The Fetch–Decode–Execute cycle as a sequence of micro-operations
- The role of buses (address, data, control)
- The concept of cache memory and why it improves performance

### Suggested classroom use

**Introducing the topic (20–30 min)**
1. Open the app in Demo mode on the projector.
2. Use the **Next** button to walk through the LOAD instruction step by step — read each explanation aloud and invite questions.
3. Once students understand the FETCH phase pattern (PC → MAR → RAM → MDR → CIR), use **▶ Play** to show the remaining instructions at speed.
4. Pause at the ADD instruction's execute phase to discuss the ALU — students often conflate the ALU and CU.

**Checking understanding (10–15 min)**
1. Ask students to open the app on their own devices (phones or laptops).
2. Have them switch to **Quiz mode**.
3. Students work through the quiz independently. Those who score below 70% should re-watch the Demo before trying again.
4. Use the score as an exit-ticket measure.

**Key discussion points to raise**

- *Why does the PC increment before the instruction is executed?*
  The CPU needs to be ready to fetch the next instruction immediately — it does not wait.

- *Why do we need both the MAR and MDR?*
  The MAR holds the **address** (where to look); the MDR holds the **data** (what was found). They serve different buses and can change independently.

- *Why is the MDR needed at all — why not write directly to the ACC?*
  The MDR decouples the slow RAM interface from the fast internal registers. During a STORE, it also holds the outgoing value while the MAR simultaneously holds the destination address.

- *What is the CIR for — why not decode straight from the MDR?*
  Once in the CIR, the instruction is safe while the MDR is freed up for the execute phase (e.g., fetching a data operand from memory).

- *Why is cache faster than RAM?*
  Cache is built from SRAM (Static RAM), which uses flip-flops — faster but physically larger and more expensive per bit than the DRAM used in main memory. Cache sits on the same die as the CPU, eliminating bus latency. The principle of **locality of reference** means recently-used data is very likely to be needed again, making cache highly effective.

- *What would happen without a HALT instruction?*
  The CPU would keep incrementing the PC and fetching whatever bytes happen to follow in memory — potentially crashing or executing garbage. HALT is an explicit stop signal sent to the CU's clock circuit.

### Common misconceptions to address

| Misconception | Correction |
|--------------|-----------|
| "The ALU fetches data from memory" | The ALU only operates on values already in the registers — the CU orchestrates the fetch |
| "The PC holds the current instruction" | The PC holds the **address** of the next instruction; the CIR holds the instruction itself |
| "The CU does the arithmetic" | The CU decodes and coordinates; the ALU performs all computation |
| "Data travels directly from RAM to the ACC" | All memory data passes through the MDR first |
| "Cache and RAM are the same thing" | Cache is faster, smaller, on-chip SRAM; RAM is slower, larger, off-chip DRAM |

---

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node)

### Install and run

```bash
git clone https://github.com/your-org/fdecycle.git
cd fdecycle
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

Output is in `dist/`. Deploy the contents of `dist/` to any static web host (Apache, Nginx, Netlify, Vercel, GitHub Pages).

For the subdomain `cpu.toolsforteaching.co.uk`, copy `dist/` to the document root and ensure the server serves `index.html` for all routes (single-page app).

### Preview the production build

```bash
npm run preview
```

---

## Project Structure

```
fdecycle/
├── index.html                    # App shell
├── vite.config.js                # Vite + React plugin config
├── package.json
│
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root — theme, mode switching
    ├── index.css                 # All styles (light + dark themes, SVG, animations)
    │
    ├── data/
    │   ├── cycleSteps.js         # All 27 FDE micro-operation definitions
    │   └── nodePositions.js      # Fixed SVG coordinates for each component
    │
    └── components/
        ├── DemoMode.jsx          # Teacher demo + CpuDiagramSVGContent (shared)
        ├── QuizMode.jsx          # Interactive quiz with scoring
        └── SparkLayer.jsx        # Animated spark travelling between nodes
```

### Key design decisions

- **Single CSS file** — all theming via CSS custom properties (`var(--x)`); no inline styles except dynamically computed values (spark keyframes, progress bar width).
- **SVG diagram** — uses a fixed 900×520 viewBox that scales responsively. All component positions are declared in `nodePositions.js` so the layout can be adjusted without touching component code.
- **`CpuDiagramSVGContent`** — the diagram drawing logic is a single exported function used by both Demo and Quiz modes, avoiding duplication.
- **Spark animation** — CSS keyframes are generated at runtime from the node coordinate data, giving smooth interpolated motion without a JS animation loop.
- **No router, no backend** — fully static; suitable for deployment on any web server or CDN.

---

## Extending the App

### Adding a new instruction

1. Add the instruction's steps to `src/data/cycleSteps.js` following the existing pattern.
2. Add the initial memory value to the `MEMORY` object at the top of the same file.
3. No changes to the diagram or quiz logic are needed — both modes read from `cycleSteps` automatically.

### Changing component positions

Edit `src/data/nodePositions.js`. The `x`/`y` values are the **centre** of each component box within the 900×520 viewBox. Bus drop-lines and internal wires in `DemoMode.jsx` reference these same constants.

### Adjusting auto-play speed

Change `AUTO_INTERVAL_MS` at the top of `src/components/DemoMode.jsx` (default: 2800 ms).

### Adjusting spark speed

Change the `duration` prop on `<SparkLayer>` in `DemoMode.jsx` and `QuizMode.jsx` (default: 900 ms).

---

## License

Copyright © 2026 Simon Rundell / Tools for Teaching

This work is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License**.

[![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license.

Full license text: [https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode)
