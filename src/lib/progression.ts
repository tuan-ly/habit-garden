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

  let target: number;

  switch (type) {
    case 'linear':
      target = startValue + range * progress;
      break;

    case 'exponential':
      // Chậm đầu, nhanh sau
      target = startValue + range * Math.pow(progress, 2);
      break;

    case 'logarithmic':
      // Nhanh đầu, chậm sau
      if (currentWeek === 0) return startValue;
      target = startValue + range * (Math.log(currentWeek + 1) / Math.log(totalWeeks + 1));
      break;

    case 's-curve':
      // Sigmoid: chậm - nhanh - chậm
      const sigmoid = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
      target = startValue + range * sigmoid;
      break;

    case 'step':
      // Bậc thang
      const steps = Math.floor(totalWeeks / stepSize);
      const currentStep = Math.floor(currentWeek / stepSize);
      target = startValue + (range / steps) * currentStep;
      break;

    default:
      target = startValue + range * progress;
  }

  // Làm tròn để không có số thập phân dài trong mục tiêu
  return Math.round(target);
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