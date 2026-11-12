import type { ClassInfo, ScheduleItem, Subject, Tkb } from "@/components/types";
import { findScheduleConflict } from "@/lib/scheduleConflict";

/** Cập nhật dữ liệu môn và dựng lại các lớp đã chọn từ danh mục hiện tại. */
export function refreshSavedSchedule(tkb: Tkb, getSubject: (id: string) => Subject) {
  const subjects: Subject[] = [];
  const selected = new Map<string, ScheduleItem>();
  let removedSubjects = 0;
  let removedClasses = 0;

  for (const item of Object.values(tkb.data.ScheduleItem ?? {})) {
    if (!selected.has(item.subjectId)) selected.set(item.subjectId, item);
  }

  for (const saved of tkb.data.Sub ?? []) {
    try {
      const current = getSubject(saved.id);
      const colors = new Map(saved.classes.map((cls) => [cls.id, cls.color]));
      current.classes.forEach((cls) => { cls.color = colors.get(cls.id) ?? cls.color; });
      subjects.push(current);
    } catch {
      removedSubjects++;
      subjects.push(saved);
    }
  }

  const schedule: Record<string, ScheduleItem> = {};
  for (const [subjectId, old] of selected) {
    const subject = subjects.find((item) => item.id === subjectId);
    const cls: ClassInfo | undefined = subject?.classes.find((item) => item.id === old.classId);
    if (!subject || !cls || !cls.schedules.length || findScheduleConflict(cls, subjectId, schedule)) {
      removedClasses++;
      continue;
    }
    const item: ScheduleItem = {
      subjectId, classId: cls.id, subjectName: subject.name, subjectCode: subject.code,
      color: cls.color, schedules: cls.schedules, credit: subject.credit,
    };
    for (const session of cls.schedules) {
      for (let period = session.startPeriod; period <= session.endPeriod; period++) {
        schedule[`${session.day}-${period}`] = item;
      }
    }
  }
  // Không ghi đè bản đã lưu nếu không thể xác định hoặc dựng lại đầy đủ lịch.
  if (removedSubjects || removedClasses) {
    return { tkb: { ...tkb, data: { Sub: subjects, ScheduleItem: tkb.data.ScheduleItem } }, removedSubjects, removedClasses };
  }
  return { tkb: { ...tkb, data: { Sub: subjects, ScheduleItem: schedule } }, removedSubjects, removedClasses };
}
