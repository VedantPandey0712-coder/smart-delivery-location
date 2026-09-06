/**
 * Location Confidence Score engine.
 *
 * Mirrors the tiers from the pitch deck exactly:
 *   30%  Address only
 *   50%  + GPS match
 *   65%  + Exact entrance pin
 *   80%  + Gate / Tower / Flat details
 *   95%  + Entrance photo evidence
 *
 * Each tier is unlocked by a specific, checkable piece of evidence on the
 * delivery point record. The function returns both the final score and a
 * breakdown array so the frontend can render the same step-by-step bar
 * shown in the deck.
 */

const TIERS = [
  {
    key: "address",
    label: "Address Only",
    points: 30,
    check: (dp) => Boolean(dp.address_text && dp.address_text.trim().length > 0),
  },
  {
    key: "gps",
    label: "Address + GPS Match",
    points: 20,
    check: (dp) => Boolean(dp.gps_confirmed && dp.latitude != null && dp.longitude != null),
  },
  {
    key: "pin",
    label: "+ Exact Entrance Pin",
    points: 15,
    check: (dp) => Boolean(dp.pin_placed),
  },
  {
    key: "building",
    label: "+ Gate / Tower / Flat Details",
    points: 15,
    check: (dp) =>
      Boolean(
        (dp.gate_entrance && dp.gate_entrance.trim()) &&
          ((dp.tower_block && dp.tower_block.trim()) || (dp.flat_number && dp.flat_number.trim()))
      ),
  },
  {
    key: "photo",
    label: "+ Entrance Photo Evidence",
    points: 15,
    check: (dp) => Boolean(dp.photo_url),
  },
];

/**
 * @param {object} deliveryPoint - a delivery_points row (snake_case fields)
 * @returns {{ score: number, breakdown: Array<{key:string,label:string,earned:boolean,points:number}> }}
 */
function calculateConfidenceScore(deliveryPoint) {
  let score = 0;
  const breakdown = [];

  for (const tier of TIERS) {
    const earned = tier.check(deliveryPoint);
    if (earned) score += tier.points;
    breakdown.push({
      key: tier.key,
      label: tier.label,
      points: tier.points,
      earned,
    });
  }

  // Small bonus for a track record of successful deliveries at this point
  // (Historical Verification feature) — capped so it never exceeds 100.
  const historyBonus = Math.min(deliveryPoint.successful_deliveries || 0, 5);
  score = Math.min(100, score + historyBonus);

  return { score, breakdown };
}

function confidenceLabel(score) {
  if (score >= 95) return "Verified — Very High Confidence";
  if (score >= 80) return "High Confidence";
  if (score >= 65) return "Moderate Confidence";
  if (score >= 50) return "Basic Confidence";
  return "Low Confidence";
}

module.exports = { calculateConfidenceScore, confidenceLabel, TIERS };
