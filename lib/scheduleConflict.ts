import type { ClassInfo, ScheduleItem } from "@/components/types";

export function findScheduleConflict(
  cls: ClassInfo,
  subjectId: string,
  schedule: Record<string, ScheduleItem>,
) {
  for (const session of cls.schedules) {
    for (let period = session.startPeriod; period <= session.endPeriod; period++) {
      const item = schedule[`${session.day}-${period}`];
      if (item && item.subjectId !== subjectId) {
        return { day: session.day, period, subjectName: item.subjectName };
      }
    }
  }
  return null;
}
