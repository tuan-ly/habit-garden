// lib/progression.ts

export type ProgressionType = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'step';

interface ProgressionParams {
  startValue: number;
  endValue: number;
  totalWeeks: number;
  currentWeek: number;
  type: ProgressionType;
  stepSize?: number; // Cho step type
}

export function calculateTarget(params: ProgressionParams): number {
  const { startValue, endValue, totalWeeks, currentWeek, type, stepSize = 5 } = params;
  const range = endValue - startValue;
  const progress = currentWeek / totalWeeks;

  switch (type) {
    case 'linear':
      return startValue + range * progress;

    case 'exponential':
      // Chậm đầu, nhanh sau
      return startValue + range * Math.pow(progress, 2);

    case 'logarithmic':
      // Nhanh đầu, chậm sau
      if (currentWeek === 0) return startValue;
      return startValue + range * (Math.log(currentWeek + 1) / Math.log(totalWeeks + 1));

    case 's-curve':
      // Sigmoid: chậm - nhanh - chậm
      const sigmoid = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
      return startValue + range * sigmoid;

    case 'step':
      // Bậc thang
      const steps = Math.floor(totalWeeks / stepSize);
      const currentStep = Math.floor(currentWeek / stepSize);
      return startValue + (range / steps) * currentStep;

    default:
      return startValue + range * progress;
  }
}

// Generate full progression plan
export function generateProgressionPlan(params: Omit<ProgressionParams, 'currentWeek'>): number[] {
  const plan: number[] = [];
  for (let week = 0; week <= params.totalWeeks; week++) {
    plan.push(calculateTarget({ ...params, currentWeek: week }));
  }
  return plan;
}

// Ví dụ sử dụng:
// const plan = generateProgressionPlan({
//   startValue: 2,      // 2 km
//   endValue: 10,       // 10 km
//   totalWeeks: 50,
//   type: 'exponential'
// });
// → [2, 2.006, 2.026, 2.058, ..., 9.68, 10]