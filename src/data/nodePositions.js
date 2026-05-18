/**
 * @fileoverview Fixed positions for every CPU component in the 960×460 SVG viewBox.
 *
 * Layout — three horizontal bus corridors sit in the GAPS between components:
 *
 *   y=108  Address Bus  — 30px below PC bottom (78),  30px above MAR/CU top (138)
 *   y=226  Data Bus     — 30px below MAR bottom (196), 30px above MDR/ALU top (256)
 *   y=344  Control Bus  — 30px below MDR bottom (314), 30px above CIR/ACC top (374)
 *
 * Every component edge is at least 30 px from its nearest bus line.
 */

export const NODE_SIZE = { w: 130, h: 58 };

export const NODE_POSITIONS = {
  // Left register column  (x=150 centre)
  PC:  { x: 150, y: 49  },   // top=20,  bottom=78
  MAR: { x: 150, y: 167 },   // top=138, bottom=196
  MDR: { x: 150, y: 285 },   // top=256, bottom=314
  CIR: { x: 150, y: 403 },   // top=374, bottom=432

  // Centre CPU units  (x=410 centre)
  CU:  { x: 410, y: 167 },   // top=138, bottom=196
  ALU: { x: 410, y: 285 },   // top=256, bottom=314
  ACC: { x: 410, y: 403 },   // top=374, bottom=432

  // External memory  (x=800 centre)
  RAM: { x: 800, y: 285 },   // top=256, bottom=314
};
