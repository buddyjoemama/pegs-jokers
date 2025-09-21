export function polarToXY(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function slotAngle(
  index: number,
  total: number,
  rotationOffsetRad: number = -Math.PI / 2
) {
  return (index / total) * Math.PI * 2 + rotationOffsetRad;
}

export function slotPosition(
  index: number,
  total: number,
  cx: number,
  cy: number,
  r: number,
  rotationOffsetRad?: number
) {
  const a = slotAngle(index, total, rotationOffsetRad);
  return polarToXY(cx, cy, r, a);
}
