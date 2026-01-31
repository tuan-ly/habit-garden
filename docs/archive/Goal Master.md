# Goal Master Web App - Technical Specification

## Overview

Goal Master là một web app giúp người dùng đạt mục tiêu thông qua việc tracking tiến độ bằng số liệu thực, không phải checkbox. Điểm khác biệt cốt lõi là hệ thống **Smart Progression** - tự động tính toán target tăng dần theo thời gian.

**Core Philosophy:** "Start small, connect big, forgive when you stumble."

---

## 1. Data Models

### 1.1 Goal

```typescript
interface Goal {
  id: string;
  name: string;
  
  // Basic
  unit: string;                    // "pages", "km", "minutes", "dollars"
  frequency: "daily" | "weekly" | "monthly";
  scheduledDays?: number[];        // [1,2,3,4,5] = Mon-Fri (0=Sun, 6=Sat)
  status: "planned" | "active" | "paused" | "done";
  
  // Target
  target: number;                  // Final target number
  targetType: "capacity" | "total"; // Build capacity vs Reach total
  trackBy: "sum" | "max" | "min" | "average";
  lowerIsBetter: boolean;          // For speed/reduction goals
  
  // Plan (optional)
  timeline?: {
    start: Date;
    end: Date;
  };
  plan?: "steady" | "accelerating" | "custom" | null; // null = fixed target
  initialTarget?: number;          // Starting target (if using plan)
  customPlan?: number[];           // User-defined targets per period
  
  // Relations
  areaId?: string;                 // Link to life area (Health, Wealth, etc.)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 Log

```typescript
interface Log {
  id: string;
  goalId: string;
  value: number;
  date: Date;
  note?: string;
  createdAt: Date;
}
```

### 1.3 Area (Optional)

```typescript
interface Area {
  id: string;
  name: string;           // "Health", "Wealth", "Wisdom", etc.
  icon: string;
  color: string;
}
```

---

## 2. Core Calculations

### 2.1 Period Calculation

Xác định period hiện tại dựa trên frequency:

```typescript
interface Period {
  index: number;          // 0-based index from timeline start
  start: Date;
  end: Date;
  target: number;         // Calculated target for this period
  actual: number;         // Sum/Max/Min/Avg of logs in period
  status: "past" | "current" | "future";
  hit: boolean;           // actual >= target (or <= if lowerIsBetter)
}

function calculatePeriodDates(
  date: Date, 
  frequency: "daily" | "weekly" | "monthly"
): { start: Date; end: Date } {
  switch (frequency) {
    case "daily":
      return {
        start: startOfDay(date),
        end: endOfDay(date)
      };
    
    case "weekly":
      // Week starts on Monday
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = addDays(date, mondayOffset);
      return {
        start: startOfDay(monday),
        end: endOfDay(addDays(monday, 6))
      };
    
    case "monthly":
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
  }
}
```

### 2.2 Total Periods Calculation

```typescript
function calculateTotalPeriods(
  timeline: { start: Date; end: Date },
  frequency: "daily" | "weekly" | "monthly"
): number {
  const { start, end } = timeline;
  
  switch (frequency) {
    case "daily":
      return differenceInDays(end, start) + 1;
    
    case "weekly":
      return differenceInWeeks(end, start) + 1;
    
    case "monthly":
      return differenceInMonths(end, start) + 1;
  }
}
```

### 2.3 Current Period Index

```typescript
function getCurrentPeriodIndex(
  timeline: { start: Date; end: Date },
  frequency: "daily" | "weekly" | "monthly",
  currentDate: Date = new Date()
): number {
  const { start } = timeline;
  
  // If before timeline start
  if (currentDate < start) return -1;
  
  // If after timeline end
  if (currentDate > timeline.end) {
    return calculateTotalPeriods(timeline, frequency);
  }
  
  switch (frequency) {
    case "daily":
      return differenceInDays(currentDate, start);
    
    case "weekly":
      return differenceInWeeks(currentDate, start);
    
    case "monthly":
      return differenceInMonths(currentDate, start);
  }
}
```

---

## 3. Plan Calculation (Core Feature)

### 3.1 Overview

Plan tính toán target cho từng period dựa trên:
- **initialTarget**: Target ban đầu (nhỏ, dễ đạt)
- **target**: Target cuối cùng
- **totalPeriods**: Số period trong timeline
- **planType**: Cách tăng (steady/accelerating/custom)

### 3.2 Steady (Linear Growth)

Target tăng đều mỗi period.

```
Formula: target_n = initial + (final - initial) × (n / (totalPeriods - 1))
```

```typescript
function calculateSteadyTarget(
  initialTarget: number,
  finalTarget: number,
  totalPeriods: number,
  currentPeriodIndex: number
): number {
  // Edge cases
  if (totalPeriods <= 1) return finalTarget;
  if (currentPeriodIndex <= 0) return initialTarget;
  if (currentPeriodIndex >= totalPeriods - 1) return finalTarget;
  
  const increment = (finalTarget - initialTarget) / (totalPeriods - 1);
  const target = initialTarget + (increment * currentPeriodIndex);
  
  return Math.min(Math.round(target), finalTarget);
}
```

**Example:** initial=10, final=50, periods=5
```
Period 0: 10
Period 1: 20  (+10)
Period 2: 30  (+10)
Period 3: 40  (+10)
Period 4: 50  (+10)
```

### 3.3 Accelerating (Exponential Growth)

Target tăng chậm ban đầu, nhanh dần về cuối. Phù hợp với việc xây dựng thói quen - dễ ở đầu, thử thách hơn khi đã có momentum.

```
Formula: target_n = initial × (final/initial)^(n / (totalPeriods - 1))
```

```typescript
function calculateAcceleratingTarget(
  initialTarget: number,
  finalTarget: number,
  totalPeriods: number,
  currentPeriodIndex: number
): number {
  // Edge cases
  if (totalPeriods <= 1) return finalTarget;
  if (currentPeriodIndex <= 0) return initialTarget;
  if (currentPeriodIndex >= totalPeriods - 1) return finalTarget;
  if (initialTarget <= 0) return finalTarget; // Prevent division by zero
  
  const ratio = Math.pow(finalTarget / initialTarget, 1 / (totalPeriods - 1));
  const target = initialTarget * Math.pow(ratio, currentPeriodIndex);
  
  return Math.min(Math.round(target), finalTarget);
}
```

**Example:** initial=10, final=50, periods=5
```
Period 0: 10
Period 1: 14  (+4)   - Tăng chậm
Period 2: 22  (+8)   - Tăng vừa
Period 3: 33  (+11)  - Tăng nhanh
Period 4: 50  (+17)  - Tăng mạnh
```

### 3.4 Custom (User-Defined)

User tự định nghĩa target cho từng period.

```typescript
function calculateCustomTarget(
  customPlan: number[],
  finalTarget: number,
  currentPeriodIndex: number
): number {
  if (currentPeriodIndex < 0) return customPlan[0] ?? finalTarget;
  if (currentPeriodIndex >= customPlan.length) return finalTarget;
  
  return customPlan[currentPeriodIndex];
}
```

**Example:** customPlan=[10, 15, 20, 35, 50]
```
Period 0: 10
Period 1: 15
Period 2: 20
Period 3: 35
Period 4: 50
```

### 3.5 Unified Plan Calculator

```typescript
function calculatePeriodTarget(goal: Goal, periodIndex: number): number {
  // No plan = fixed target
  if (!goal.plan || !goal.timeline || !goal.initialTarget) {
    return goal.target;
  }
  
  const totalPeriods = calculateTotalPeriods(goal.timeline, goal.frequency);
  
  switch (goal.plan) {
    case "steady":
      return calculateSteadyTarget(
        goal.initialTarget,
        goal.target,
        totalPeriods,
        periodIndex
      );
    
    case "accelerating":
      return calculateAcceleratingTarget(
        goal.initialTarget,
        goal.target,
        totalPeriods,
        periodIndex
      );
    
    case "custom":
      return calculateCustomTarget(
        goal.customPlan ?? [],
        goal.target,
        periodIndex
      );
    
    default:
      return goal.target;
  }
}
```

---

## 4. Performance Tracking

### 4.1 Get Logs for Period

```typescript
function getLogsForPeriod(
  logs: Log[],
  periodStart: Date,
  periodEnd: Date
): Log[] {
  return logs.filter(log => 
    log.date >= periodStart && log.date <= periodEnd
  );
}
```

### 4.2 Calculate Actual Value

```typescript
function calculateActual(
  logs: Log[],
  trackBy: "sum" | "max" | "min" | "average"
): number {
  if (logs.length === 0) return 0;
  
  const values = logs.map(log => log.value);
  
  switch (trackBy) {
    case "sum":
      return values.reduce((sum, v) => sum + v, 0);
    
    case "max":
      return Math.max(...values);
    
    case "min":
      return Math.min(...values);
    
    case "average":
      return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}
```

### 4.3 Check Hit/Miss

```typescript
function isHit(
  actual: number,
  target: number,
  lowerIsBetter: boolean
): boolean {
  if (target === 0) return actual > 0;
  
  if (lowerIsBetter) {
    return actual > 0 && actual <= target;
  }
  
  return actual >= target;
}
```

### 4.4 Build All Periods

```typescript
function buildAllPeriods(goal: Goal, logs: Log[]): Period[] {
  if (!goal.timeline) return [];
  
  const totalPeriods = calculateTotalPeriods(goal.timeline, goal.frequency);
  const today = new Date();
  const periods: Period[] = [];
  
  for (let i = 0; i < totalPeriods; i++) {
    // Calculate period dates
    const periodDate = addPeriods(goal.timeline.start, i, goal.frequency);
    const { start, end } = calculatePeriodDates(periodDate, goal.frequency);
    
    // Get target for this period
    const target = calculatePeriodTarget(goal, i);
    
    // Get logs in this period
    const periodLogs = getLogsForPeriod(logs, start, end);
    
    // Calculate actual value
    const actual = calculateActual(periodLogs, goal.trackBy);
    
    // Determine status
    let status: "past" | "current" | "future";
    if (end < today) {
      status = "past";
    } else if (start <= today && today <= end) {
      status = "current";
    } else {
      status = "future";
    }
    
    // Check hit (only for past and current)
    const hit = status !== "future" 
      ? isHit(actual, target, goal.lowerIsBetter)
      : false;
    
    periods.push({
      index: i,
      start,
      end,
      target,
      actual,
      status,
      hit
    });
  }
  
  return periods;
}

// Helper function
function addPeriods(
  date: Date, 
  count: number, 
  frequency: "daily" | "weekly" | "monthly"
): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, count);
    case "weekly":
      return addWeeks(date, count);
    case "monthly":
      return addMonths(date, count);
  }
}
```

---

## 5. Statistics & Metrics

### 5.1 Hit Rate

```typescript
function calculateHitRate(periods: Period[]): number {
  const completedPeriods = periods.filter(p => p.status === "past");
  if (completedPeriods.length === 0) return 0;
  
  const hits = completedPeriods.filter(p => p.hit).length;
  return (hits / completedPeriods.length) * 100;
}
```

### 5.2 Current Streak

```typescript
function calculateStreak(periods: Period[]): number {
  // Get completed periods, newest first
  const completed = periods
    .filter(p => p.status === "past" || p.status === "current")
    .reverse();
  
  let streak = 0;
  
  for (const period of completed) {
    if (period.hit) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
```

### 5.3 Best Streak

```typescript
function calculateBestStreak(periods: Period[]): number {
  const completed = periods.filter(p => p.status !== "future");
  
  let currentStreak = 0;
  let bestStreak = 0;
  
  for (const period of completed) {
    if (period.hit) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return bestStreak;
}
```

### 5.4 Progress (for Total Target type)

```typescript
function calculateTotalProgress(
  goal: Goal,
  logs: Log[]
): { current: number; target: number; percentage: number } {
  if (goal.targetType !== "total") {
    return { current: 0, target: 0, percentage: 0 };
  }
  
  // Filter logs within timeline
  const timelineLogs = goal.timeline
    ? logs.filter(log => 
        log.date >= goal.timeline!.start && 
        log.date <= goal.timeline!.end
      )
    : logs;
  
  const current = calculateActual(timelineLogs, "sum");
  const percentage = goal.target > 0 
    ? Math.min((current / goal.target) * 100, 100)
    : 0;
  
  return {
    current,
    target: goal.target,
    percentage
  };
}
```

### 5.5 Today's Target

```typescript
function getTodayTarget(goal: Goal): number {
  if (!goal.timeline) return goal.target;
  
  const today = new Date();
  
  // Check if today is within timeline
  if (today < goal.timeline.start || today > goal.timeline.end) {
    return goal.target;
  }
  
  const currentPeriodIndex = getCurrentPeriodIndex(
    goal.timeline,
    goal.frequency,
    today
  );
  
  return calculatePeriodTarget(goal, currentPeriodIndex);
}
```

---

## 6. Goal Statistics Summary

```typescript
interface GoalStats {
  // Current period
  todayTarget: number;
  todayActual: number;
  todayHit: boolean;
  
  // Overall progress (for total targets)
  totalProgress?: {
    current: number;
    target: number;
    percentage: number;
  };
  
  // Performance
  hitRate: number;           // Percentage
  currentStreak: number;
  bestStreak: number;
  
  // Timeline
  daysRemaining: number;
  periodsCompleted: number;
  totalPeriods: number;
  
  // Periods data (for chart)
  periods: Period[];
}

function calculateGoalStats(goal: Goal, logs: Log[]): GoalStats {
  const periods = buildAllPeriods(goal, logs);
  const today = new Date();
  
  // Current period
  const currentPeriod = periods.find(p => p.status === "current");
  const todayTarget = currentPeriod?.target ?? goal.target;
  const todayActual = currentPeriod?.actual ?? 0;
  const todayHit = currentPeriod?.hit ?? false;
  
  // Timeline info
  const daysRemaining = goal.timeline 
    ? Math.max(0, differenceInDays(goal.timeline.end, today))
    : 0;
  const periodsCompleted = periods.filter(p => p.status === "past").length;
  
  return {
    todayTarget,
    todayActual,
    todayHit,
    
    totalProgress: goal.targetType === "total"
      ? calculateTotalProgress(goal, logs)
      : undefined,
    
    hitRate: calculateHitRate(periods),
    currentStreak: calculateStreak(periods),
    bestStreak: calculateBestStreak(periods),
    
    daysRemaining,
    periodsCompleted,
    totalPeriods: periods.length,
    
    periods
  };
}
```

---

## 7. UI Components

### 7.1 Today's View

```typescript
interface TodayViewData {
  goals: Array<{
    goal: Goal;
    target: number;
    actual: number;
    remaining: number;
    percentage: number;
    hit: boolean;
  }>;
}

function getTodayViewData(goals: Goal[], logsByGoal: Map<string, Log[]>): TodayViewData {
  return {
    goals: goals
      .filter(g => g.status === "active")
      .map(goal => {
        const logs = logsByGoal.get(goal.id) ?? [];
        const stats = calculateGoalStats(goal, logs);
        
        return {
          goal,
          target: stats.todayTarget,
          actual: stats.todayActual,
          remaining: Math.max(0, stats.todayTarget - stats.todayActual),
          percentage: stats.todayTarget > 0 
            ? Math.min((stats.todayActual / stats.todayTarget) * 100, 100)
            : 0,
          hit: stats.todayHit
        };
      })
  };
}
```

### 7.2 Progress Chart Data

```typescript
interface ChartData {
  labels: string[];          // Period labels
  targets: number[];         // Target line
  actuals: number[];         // Actual values
  hits: boolean[];           // Hit/miss indicators
}

function getChartData(periods: Period[], frequency: string): ChartData {
  const formatLabel = (period: Period): string => {
    switch (frequency) {
      case "daily":
        return format(period.start, "MMM d");
      case "weekly":
        return `W${getWeek(period.start)}`;
      case "monthly":
        return format(period.start, "MMM");
    }
    return "";
  };
  
  return {
    labels: periods.map(formatLabel),
    targets: periods.map(p => p.target),
    actuals: periods.map(p => p.actual),
    hits: periods.map(p => p.hit)
  };
}
```

---

## 8. Validation Rules

### 8.1 Goal Validation

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validateGoal(goal: Partial<Goal>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!goal.name?.trim()) {
    errors.push({ field: "name", message: "Goal name is required" });
  }
  
  if (!goal.unit?.trim()) {
    errors.push({ field: "unit", message: "Unit is required" });
  }
  
  if (!goal.target || goal.target <= 0) {
    errors.push({ field: "target", message: "Target must be greater than 0" });
  }
  
  // Timeline validation
  if (goal.timeline) {
    if (goal.timeline.end <= goal.timeline.start) {
      errors.push({ field: "timeline", message: "End date must be after start date" });
    }
  }
  
  // Plan validation
  if (goal.plan && goal.plan !== "custom") {
    if (!goal.initialTarget || goal.initialTarget <= 0) {
      errors.push({ field: "initialTarget", message: "Initial target is required for smart progression" });
    }
    
    if (goal.initialTarget && goal.target && goal.initialTarget >= goal.target) {
      errors.push({ field: "initialTarget", message: "Initial target must be less than final target" });
    }
    
    if (!goal.timeline) {
      errors.push({ field: "timeline", message: "Timeline is required for smart progression" });
    }
  }
  
  // Custom plan validation
  if (goal.plan === "custom") {
    if (!goal.customPlan || goal.customPlan.length === 0) {
      errors.push({ field: "customPlan", message: "Custom plan values are required" });
    }
  }
  
  return errors;
}
```

### 8.2 Log Validation

```typescript
function validateLog(log: Partial<Log>, goal: Goal): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (log.value === undefined || log.value < 0) {
    errors.push({ field: "value", message: "Value must be 0 or greater" });
  }
  
  if (!log.date) {
    errors.push({ field: "date", message: "Date is required" });
  }
  
  // Check if date is within timeline (warning, not error)
  if (goal.timeline && log.date) {
    if (log.date < goal.timeline.start || log.date > goal.timeline.end) {
      errors.push({ 
        field: "date", 
        message: "Date is outside goal timeline (log will not count toward progress)" 
      });
    }
  }
  
  return errors;
}
```

---

## 9. Example Scenarios

### 9.1 Reading Goal (Capacity Building)

```typescript
const readingGoal: Goal = {
  id: "1",
  name: "Read",
  unit: "pages",
  frequency: "daily",
  status: "active",
  target: 50,
  targetType: "capacity",
  trackBy: "sum",
  lowerIsBetter: false,
  timeline: {
    start: new Date("2026-01-01"),
    end: new Date("2026-02-28")  // 8 weeks
  },
  plan: "steady",
  initialTarget: 10,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Week 1: Target = 10 pages/day
// Week 2: Target = 16 pages/day
// Week 3: Target = 21 pages/day
// Week 4: Target = 27 pages/day
// Week 5: Target = 32 pages/day
// Week 6: Target = 38 pages/day
// Week 7: Target = 44 pages/day
// Week 8: Target = 50 pages/day
```

### 9.2 Savings Goal (Total Target)

```typescript
const savingsGoal: Goal = {
  id: "2",
  name: "Save Money",
  unit: "dollars",
  frequency: "monthly",
  status: "active",
  target: 5000,
  targetType: "total",
  trackBy: "sum",
  lowerIsBetter: false,
  timeline: {
    start: new Date("2026-01-01"),
    end: new Date("2026-12-31")  // 12 months
  },
  plan: "accelerating",
  initialTarget: 200,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Month 1:  Target = $200  (total: $200)
// Month 2:  Target = $251  (total: $451)
// Month 3:  Target = $315  (total: $766)
// Month 4:  Target = $396  (total: $1162)
// Month 5:  Target = $497  (total: $1659)
// Month 6:  Target = $624  (total: $2283)
// Month 7:  Target = $783  (total: $3066)
// Month 8:  Target = $983  (total: $4049)
// Month 9:  Target = $1234 (total: $5283 - exceed!)
```

### 9.3 Running Goal (Fixed Target)

```typescript
const runningGoal: Goal = {
  id: "3",
  name: "Run",
  unit: "km",
  frequency: "weekly",
  status: "active",
  target: 20,
  targetType: "capacity",
  trackBy: "sum",
  lowerIsBetter: false,
  timeline: {
    start: new Date("2026-01-01"),
    end: new Date("2026-03-31")
  },
  plan: null,  // No progression - fixed target
  createdAt: new Date(),
  updatedAt: new Date()
};

// Every week: Target = 20km
```

### 9.4 Speed Goal (Lower is Better)

```typescript
const speedGoal: Goal = {
  id: "4",
  name: "5K Time",
  unit: "minutes",
  frequency: "weekly",
  status: "active",
  target: 25,          // Goal: run 5K in 25 minutes
  targetType: "capacity",
  trackBy: "min",      // Track best (lowest) time
  lowerIsBetter: true,
  timeline: {
    start: new Date("2026-01-01"),
    end: new Date("2026-06-30")
  },
  plan: "steady",
  initialTarget: 35,   // Start at 35 minutes
  createdAt: new Date(),
  updatedAt: new Date()
};

// Target decreases: 35 → 33 → 31 → 29 → 27 → 25
// Hit = actual <= target
```

---

## 10. API Endpoints (Reference)

```typescript
// Goals
GET    /api/goals                    // List all goals
GET    /api/goals/:id                // Get goal with stats
POST   /api/goals                    // Create goal
PUT    /api/goals/:id                // Update goal
DELETE /api/goals/:id                // Delete goal

// Logs
GET    /api/goals/:id/logs           // Get logs for goal
POST   /api/goals/:id/logs           // Create log
PUT    /api/logs/:id                 // Update log
DELETE /api/logs/:id                 // Delete log

// Stats
GET    /api/goals/:id/stats          // Get full stats
GET    /api/today                    // Get today's view data

// Areas
GET    /api/areas                    // List areas
POST   /api/areas                    // Create area
```

---

## 11. Testing Checklist

### Plan Calculations
- [ ] Steady progression với various period counts (1, 2, 5, 10, 52)
- [ ] Accelerating progression với small và large ratios
- [ ] Custom plan với fewer/more entries than periods
- [ ] Edge cases: period 0, last period, beyond timeline

### Performance Tracking
- [ ] Sum, Max, Min, Average calculations
- [ ] Lower is better logic
- [ ] Empty logs handling
- [ ] Logs outside timeline

### Statistics
- [ ] Hit rate với 0%, 50%, 100%
- [ ] Streak calculation with gaps
- [ ] Progress for total targets

### Timeline Edge Cases
- [ ] Before timeline start
- [ ] After timeline end
- [ ] Single day/week/month timeline
- [ ] Very long timeline (1+ years)

---

## 12. Performance Considerations

1. **Lazy Loading**: Chỉ calculate periods khi cần display
2. **Caching**: Cache calculated stats, invalidate khi có log mới
3. **Pagination**: Limit số logs load cho goals cũ
4. **Indexing**: Index logs by goalId + date

---

## Summary

Core features cần implement:
1. **Plan Calculator**: Steady, Accelerating, Custom progression
2. **Period Builder**: Build periods từ timeline + frequency
3. **Performance Tracker**: Calculate actual từ logs với multiple track methods
4. **Statistics Engine**: Hit rate, streaks, progress
5. **Today's View**: Aggregate active goals với current targets
