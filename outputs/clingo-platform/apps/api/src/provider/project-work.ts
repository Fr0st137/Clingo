export type ProjectEstimate = {
  source: "area" | "historical-plan";
  areaSquareMeters: number | null;
  workMinutesPerSquareMeter: number | null;
  fixedWorkMinutes: number;
  requiredWorkMinutes: number;
  estimatedWorkers: number;
};
export type ProjectBalance = { requiredMinutes: number; plannedMinutes: number; remainingMinutes: number; excessMinutes: number; percentage: number; state: "shortage" | "excess" | "balanced" };
export type ProjectEdit = { at: string; actor: string; added: string[]; removed: string[]; changed: string[]; areaChanged: boolean; confirmedShortage: boolean; confirmedExcess: boolean; confirmedUnderstaffing?: boolean };
export function projectBalance(requiredMinutes: number, sessions: Array<{ durationMinutes: number; workers: number }>): ProjectBalance {
  const plannedMinutes = Math.round(sessions.reduce((sum, row) => sum + row.durationMinutes * row.workers, 0) * 10000) / 10000;
  const difference = Math.round((requiredMinutes - plannedMinutes) * 10000) / 10000;
  return { requiredMinutes, plannedMinutes, remainingMinutes: Math.max(0, difference), excessMinutes: Math.max(0, -difference),
    percentage: requiredMinutes > 0 ? Math.round(plannedMinutes / requiredMinutes * 1000) / 10 : 0,
    state: difference > 0 ? "shortage" : difference < 0 ? "excess" : "balanced" };
}
export function estimateForArea(estimate: ProjectEstimate, area: number | null): ProjectEstimate {
  if (area === estimate.areaSquareMeters) return { ...estimate };
  if (area === null || !Number.isFinite(area) || area <= 0 || area > 10000 || Math.abs(Math.round(area * 100) - area * 100)>1e-7 || estimate.workMinutesPerSquareMeter === null) throw new Error("Podaj powierzchnię od 0,01 do 10 000 m², z maksymalnie dwoma miejscami po przecinku.");
  return { ...estimate, areaSquareMeters: area, requiredWorkMinutes: Math.round((area * estimate.workMinutesPerSquareMeter + estimate.fixedWorkMinutes) * 10000) / 10000 };
}
export function historicalEstimate(area: number | null, totalMinutes: number, workers: number): ProjectEstimate {
  return { source: "historical-plan", areaSquareMeters: area, workMinutesPerSquareMeter: area && area > 0 ? totalMinutes / area : null,
    fixedWorkMinutes: 0, requiredWorkMinutes: totalMinutes, estimatedWorkers: workers };
}
