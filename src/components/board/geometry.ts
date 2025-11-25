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

/**
 * Calculate position for a slot on an n-gon (polygon) track
 * @param index - Slot index (0 to total-1)
 * @param total - Total number of slots
 * @param playerCount - Number of players (determines polygon sides)
 * @param cx - Center X coordinate
 * @param cy - Center Y coordinate
 * @param r - Radius from center to polygon vertices
 * @returns {x, y} coordinates for the slot
 */
export function ngonSlotPosition(
  index: number,
  total: number,
  playerCount: number,
  cx: number,
  cy: number,
  r: number
) {
  const slotsPerSide = total / playerCount;
  
  // Determine which side of the polygon this slot is on
  const sideIndex = Math.floor(index / slotsPerSide);
  const slotOnSide = index % slotsPerSide;
  
  // Calculate the two corner points of this side
  const corner1Angle = slotAngle(sideIndex, playerCount);
  const corner2Angle = slotAngle(sideIndex + 1, playerCount);
  
  const corner1 = polarToXY(cx, cy, r, corner1Angle);
  const corner2 = polarToXY(cx, cy, r, corner2Angle);
  
  // Interpolate along the edge between corners
  const t = slotOnSide / slotsPerSide;
  
  return {
    x: corner1.x + (corner2.x - corner1.x) * t,
    y: corner1.y + (corner2.y - corner1.y) * t,
  };
}

/**
 * Generate HOME positions (cross shape with 5 positions)
 * HOME is a separate track extension starting INSIDE the polygon at position 9
 */
export function getHomePositions(
  playerIndex: number,
  playerCount: number,
  cx: number,
  cy: number,
  r: number,
  spacing: number
) {
  const laneStartAngle = slotAngle(playerIndex, playerCount);
  const laneEndAngle = slotAngle(playerIndex + 1, playerCount);
  
  const slotsPerSide = 18;
  const slotIndex = 8; // HOME connects at position 9 (using 8 for 0-based indexing, so 9th slot from start)
  
  // Get the position on the polygon edge (connection point to track)
  const corner1 = polarToXY(cx, cy, r, laneStartAngle);
  const corner2 = polarToXY(cx, cy, r, laneEndAngle);
  const t = slotIndex / slotsPerSide;
  const trackPoint = {
    x: corner1.x + (corner2.x - corner1.x) * t,
    y: corner1.y + (corner2.y - corner1.y) * t,
  };
  
  // Calculate direction perpendicular to the polygon edge (pointing inward)
  const edgeX = corner2.x - corner1.x;
  const edgeY = corner2.y - corner1.y;
  const edgeLength = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
  
  // Perpendicular vector (rotated 90 degrees), normalized
  let perpX = -edgeY / edgeLength;
  let perpY = edgeX / edgeLength;
  
  // Make sure perpendicular points inward (toward center)
  const toCenter = { x: cx - trackPoint.x, y: cy - trackPoint.y };
  const dot = perpX * toCenter.x + perpY * toCenter.y;
  if (dot < 0) {
    perpX = -perpX;
    perpY = -perpY;
  }
  
  // Use fixed spacing for HOME positions (independent of player count)
  const fixedSpacing = 17;
  const distanceFromTrack = 35;
  
  // Start HOME one spacing unit INSIDE the polygon (no overlap with track)
  const homeCenter = {
    x: trackPoint.x + perpX * distanceFromTrack,
    y: trackPoint.y + perpY * distanceFromTrack,
  };
  
  // Cross shape: center + 4 arms (all positions inside the polygon)
  return [
    homeCenter, // Center (position 1)
    { x: homeCenter.x + perpX * fixedSpacing, y: homeCenter.y + perpY * fixedSpacing }, // Inward (2)
    { x: homeCenter.x - perpX * fixedSpacing, y: homeCenter.y - perpY * fixedSpacing }, // Toward track (3)
    { x: homeCenter.x + perpY * fixedSpacing, y: homeCenter.y - perpX * fixedSpacing }, // Right (4)
    { x: homeCenter.x - perpY * fixedSpacing, y: homeCenter.y + perpX * fixedSpacing }, // Left (5)
  ];
}

/**
 * Generate SAFE positions (L shape with 5 positions)
 * SAFE is a separate track extension starting INSIDE the polygon at position 4
 */
export function getSafePositions(
  playerIndex: number,
  playerCount: number,
  cx: number,
  cy: number,
  r: number,
  spacing: number
) {
  const laneStartAngle = slotAngle(playerIndex, playerCount);
  const laneEndAngle = slotAngle(playerIndex + 1, playerCount);
  
  const slotsPerSide = 18;
  const slotIndex = 3; // SAFE connects at position 4 (using 3 to be closer to start)
  
  // Get the position on the polygon edge (connection point to track)
  const corner1 = polarToXY(cx, cy, r, laneStartAngle);
  const corner2 = polarToXY(cx, cy, r, laneEndAngle);
  const t = slotIndex / slotsPerSide;
  const trackPoint = {
    x: corner1.x + (corner2.x - corner1.x) * t,
    y: corner1.y + (corner2.y - corner1.y) * t,
  };
  
  // Calculate direction perpendicular to the polygon edge (pointing inward)
  const edgeX = corner2.x - corner1.x;
  const edgeY = corner2.y - corner1.y;
  const edgeLength = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
  
  // Perpendicular vector (rotated 90 degrees), normalized
  let perpX = -edgeY / edgeLength;
  let perpY = edgeX / edgeLength;
  
  // Make sure perpendicular points inward (toward center)
  const toCenter = { x: cx - trackPoint.x, y: cy - trackPoint.y };
  const dot = perpX * toCenter.x + perpY * toCenter.y;
  if (dot < 0) {
    perpX = -perpX;
    perpY = -perpY;
  }
  
  // Along-edge direction (normalized)
  const alongX = edgeX / edgeLength;
  const alongY = edgeY / edgeLength;
  
  // Use fixed spacing for SAFE positions (independent of player count)
  const fixedSpacing = 17;
  const distanceFromTrack = 18;
  
  // L shape: Start one spacing unit inside, then 4 more positions (3 inward, 2 along edge)
  const safeStart = {
    x: trackPoint.x + perpX * distanceFromTrack,
    y: trackPoint.y + perpY * distanceFromTrack,
  };
  
  return [
    safeStart, // Entry point (position 1)
    { x: safeStart.x + perpX * fixedSpacing, y: safeStart.y + perpY * fixedSpacing }, // Inward 1 (2)
    { x: safeStart.x + perpX * fixedSpacing * 2, y: safeStart.y + perpY * fixedSpacing * 2 }, // Inward 2 (3)
    { x: safeStart.x + perpX * fixedSpacing * 2 + alongX * fixedSpacing, y: safeStart.y + perpY * fixedSpacing * 2 + alongY * fixedSpacing }, // Turn (4)
    { x: safeStart.x + perpX * fixedSpacing * 2 + alongX * fixedSpacing * 2, y: safeStart.y + perpY * fixedSpacing * 2 + alongY * fixedSpacing * 2 }, // End (5)
  ];
}

/**
 * Get all track positions including main lane, HOME, and SAFE areas
 */
export function getTrackLayout(playerCount: number, cx: number, cy: number, r: number, spacing: number = 20) {
  const slotsPerLane = 18;
  const totalMainSlots = playerCount * slotsPerLane;
  
  // Scale HOME and SAFE spacing to match track slot spacing
  const adjustedSpacing = spacing;
  
  const layout = {
    mainTrack: [] as Array<{ x: number; y: number; index: number; playerLane: number }>,
    homes: [] as Array<{ positions: Array<{ x: number; y: number }>, playerIndex: number }>,
    safes: [] as Array<{ positions: Array<{ x: number; y: number }>, playerIndex: number }>,
  };
  
  // Generate main track positions (1-based indexing)
  for (let i = 0; i < totalMainSlots; i++) {
    const pos = ngonSlotPosition(i, totalMainSlots, playerCount, cx, cy, r);
    layout.mainTrack.push({
      ...pos,
      index: i + 1, // 1-based
      playerLane: Math.floor(i / slotsPerLane),
    });
  }
  
  // Generate HOME and SAFE for each player
  for (let p = 0; p < playerCount; p++) {
    layout.homes.push({
      positions: getHomePositions(p, playerCount, cx, cy, r, adjustedSpacing),
      playerIndex: p,
    });
    
    layout.safes.push({
      positions: getSafePositions(p, playerCount, cx, cy, r, adjustedSpacing),
      playerIndex: p,
    });
  }
  
  return layout;
}
