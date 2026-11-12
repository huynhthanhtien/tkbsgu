import rawData from "@/public/data.json";

export interface RawTkbSession {
  thu: string;
  tbd: number;
  tkt: number;
  phong?: string;
  giang_vien?: string;
  thoi_gian?: string;
  ngay?: string;
}

export interface RawClass {
  nhom_to: string;
  tkb: RawTkbSession[];
}

export interface RawSubject {
  ma_mon: string;
  ten_mon: string;
  so_tc: string | number;
  lop: RawClass[];
}

export type Campus = "cs1" | "cs2" | "main";

export interface UserPreferences {
  avoidMondayMorning?: boolean;
  avoidMorning?: boolean;
  avoidAfternoon?: boolean;
  minimizeDays?: boolean;
  avoidWeekend?: boolean;
  /** Cơ sở ưu tiên: cs1 = phòng "1.x", cs2 = "2.x", main = cơ sở chính "C.x". */
  campus?: Campus;
  customNote?: string;
}

export interface SelectedClassInfo {
  ma_mon: string;
  ten_mon: string;
  nhom_to: string;
  class_id: string; // `${ma_mon}-${nhom_to}`
  so_tc: number;
  schedules: RawTkbSession[];
}

export interface UnscheduledSubjectInfo {
  ma_mon: string;
  ten_mon: string;
  reason: string;
}

export interface ScheduleValidationResult {
  valid: boolean;
  allRequestedScheduled: boolean;
  scheduledClasses: SelectedClassInfo[];
  unscheduledSubjects: UnscheduledSubjectInfo[];
  conflicts: string[];
  totalCredits: number;
  uniqueDays: string[];
}

// Kiểm tra 2 buổi học có trùng tiết trong cùng ngày không
export function sessionsOverlap(s1: RawTkbSession, s2: RawTkbSession): boolean {
  if (s1.thu !== s2.thu) return false;
  // Trùng tiết nếu khoảng [tbd, tkt] giao nhau
  return Math.max(s1.tbd, s2.tbd) <= Math.min(s1.tkt, s2.tkt);
}

// Kiểm tra 2 lớp có xung đột lịch học không
export function classesOverlap(
  c1: RawClass,
  c2: RawClass
): { overlap: boolean; details?: string } {
  for (const s1 of c1.tkb) {
    for (const s2 of c2.tkb) {
      if (sessionsOverlap(s1, s2)) {
        const start = Math.max(s1.tbd, s2.tbd);
        const end = Math.min(s1.tkt, s2.tkt);
        return {
          overlap: true,
          details: `${s1.thu} (tiết ${start}-${end})`,
        };
      }
    }
  }
  return { overlap: false };
}

// Lấy danh sách tất cả các môn từ data.json
export function getAllSubjects(): RawSubject[] {
  return rawData.mon_hoc as unknown as RawSubject[];
}

// Tìm môn theo mã hoặc tên
export function findSubjectByCodeOrName(query: string): RawSubject | undefined {
  const normalized = query.trim().toLowerCase();
  const all = getAllSubjects();
  return all.find(
    (s) =>
      s.ma_mon.toLowerCase() === normalized ||
      s.ten_mon.toLowerCase() === normalized
  );
}

// Kiểm định danh sách lớp đã chọn
export function validateSchedule(
  selectedClassIds: string[],
  requestedSubjectCodes: string[],
  subjectsData: RawSubject[] = getAllSubjects()
): ScheduleValidationResult {
  const subjectMap = new Map<string, RawSubject>();
  for (const s of subjectsData) {
    subjectMap.set(s.ma_mon, s);
  }

  const requestedSet = new Set(requestedSubjectCodes);
  const scheduledClasses: SelectedClassInfo[] = [];
  const conflicts: string[] = [];
  const chosenBySubject = new Map<string, SelectedClassInfo>();
  const classToRawClass = new Map<string, RawClass>();

  // 1. Kiểm tra từng ID lớp
  for (const classId of selectedClassIds) {
    const dashIdx = classId.indexOf("-");
    if (dashIdx === -1) {
      conflicts.push(`Mã lớp '${classId}' không đúng định dạng {mã_môn}-{nhóm_tổ}`);
      continue;
    }
    const maMon = classId.substring(0, dashIdx);
    const nhomTo = classId.substring(dashIdx + 1);

    if (!requestedSet.has(maMon)) {
      // Bỏ qua lớp không thuộc danh sách môn được yêu cầu
      continue;
    }

    const subject = subjectMap.get(maMon);
    if (!subject) {
      conflicts.push(`Không tìm thấy môn học có mã '${maMon}' trong dữ liệu`);
      continue;
    }

    const cls = subject.lop.find((l) => l.nhom_to === nhomTo);
    if (!cls) {
      conflicts.push(
        `Không tìm thấy nhóm tổ '${nhomTo}' cho môn '${subject.ten_mon}' (${maMon})`
      );
      continue;
    }

    if (chosenBySubject.has(maMon)) {
      conflicts.push(
        `Môn '${subject.ten_mon}' (${maMon}) được chọn nhiều hơn một lớp`
      );
      continue;
    }

    const info: SelectedClassInfo = {
      ma_mon: maMon,
      ten_mon: subject.ten_mon,
      nhom_to: nhomTo,
      class_id: classId,
      so_tc: Number(subject.so_tc) || 0,
      schedules: cls.tkb,
    };

    chosenBySubject.set(maMon, info);
    scheduledClasses.push(info);
    classToRawClass.set(classId, cls);
  }

  // 2. Kiểm tra trùng lịch giữa các lớp đã chọn
  for (let i = 0; i < scheduledClasses.length; i++) {
    for (let j = i + 1; j < scheduledClasses.length; j++) {
      const c1 = scheduledClasses[i];
      const c2 = scheduledClasses[j];
      const raw1 = classToRawClass.get(c1.class_id)!;
      const raw2 = classToRawClass.get(c2.class_id)!;

      const overlapCheck = classesOverlap(raw1, raw2);
      if (overlapCheck.overlap) {
        conflicts.push(
          `Trùng lịch giữa môn '${c1.ten_mon}' (Nhóm ${c1.nhom_to}) và môn '${c2.ten_mon}' (Nhóm ${c2.nhom_to}) vào ${overlapCheck.details}`
        );
      }
    }
  }

  // 3. Xác định các môn chưa được xếp
  const unscheduledSubjects: UnscheduledSubjectInfo[] = [];
  for (const reqCode of requestedSubjectCodes) {
    if (!chosenBySubject.has(reqCode)) {
      const subject = subjectMap.get(reqCode);
      const name = subject ? subject.ten_mon : reqCode;

      // Tìm lý do tại sao môn này không xếp được
      let reason = "Trùng lịch học với các môn khác đã chọn";
      if (!subject) {
        reason = "Không tìm thấy môn trong cơ sở dữ liệu";
      } else if (subject.lop.length === 0) {
        reason = "Môn học hiện không mở lớp nào";
      } else {
        // Liệt kê các xung đột của tất cả các lớp của môn này với các lớp đã xếp
        const reasonsList: string[] = [];
        for (const l of subject.lop) {
          for (const scheduled of scheduledClasses) {
            const rawSched = classToRawClass.get(scheduled.class_id)!;
            const ov = classesOverlap(l, rawSched);
            if (ov.overlap) {
              reasonsList.push(
                `Nhóm ${l.nhom_to} trùng với môn '${scheduled.ten_mon}' (${ov.details})`
              );
              break;
            }
          }
        }
        if (reasonsList.length > 0) {
          reason = `Không có lớp nào khả dụng: ${reasonsList.join("; ")}`;
        }
      }

      unscheduledSubjects.push({
        ma_mon: reqCode,
        ten_mon: name,
        reason,
      });
    }
  }

  // Tập hợp các ngày học
  const daysSet = new Set<string>();
  let totalCredits = 0;
  for (const c of scheduledClasses) {
    totalCredits += c.so_tc;
    for (const s of c.schedules) {
      daysSet.add(s.thu);
    }
  }

  const valid = conflicts.length === 0 && unscheduledSubjects.length === 0;
  const allRequestedScheduled = unscheduledSubjects.length === 0;

  return {
    valid,
    allRequestedScheduled,
    scheduledClasses,
    unscheduledSubjects,
    conflicts,
    totalCredits,
    uniqueDays: Array.from(daysSet),
  };
}

// Tính điểm ưu tiên cho một phương án xếp lịch (điểm càng cao càng tốt)
export function evaluatePreferenceScore(
  classes: { subject: RawSubject; cls: RawClass }[],
  preferences: UserPreferences
): number {
  let score = 1000;
  const days = new Set<string>();

  for (const { cls } of classes) {
    for (const session of cls.tkb) {
      days.add(session.thu);

      // Tránh học sáng thứ Hai (Thứ 2, tiết 1-5)
      if (preferences.avoidMondayMorning) {
        if (session.thu === "Thứ 2" && session.tbd <= 5) {
          score -= 150;
        }
      }

      // Tránh học sáng (tiết 1-5)
      if (preferences.avoidMorning) {
        if (session.tbd <= 5) {
          score -= 50;
        }
      }

      // Tránh học chiều (tiết 6-10)
      if (preferences.avoidAfternoon) {
        if (session.tbd >= 6) {
          score -= 50;
        }
      }

      // Tránh học cuối tuần (Thứ 7, Chủ nhật)
      if (preferences.avoidWeekend) {
        if (
          session.thu === "Thứ 7" ||
          session.thu.toLowerCase().includes("chủ nhật")
        ) {
          score -= 100;
        }
      }
    }
  }

  // Ưu tiên ít ngày học nhất (gom lịch)
  if (preferences.minimizeDays) {
    // Càng ít ngày đi học càng được cộng điểm
    score -= days.size * 40;
  }

  return score;
}

// Thuật toán tìm phương án xếp lịch tối ưu (Constraint Satisfaction + Heuristic)
export function solveScheduleBacktracking(
  requestedSubjectCodes: string[],
  preferences: UserPreferences,
  subjectsData: RawSubject[] = getAllSubjects()
): {
  solutionFound: boolean;
  selectedClassIds: string[];
  score: number;
} {
  const subjectMap = new Map<string, RawSubject>();
  for (const s of subjectsData) {
    subjectMap.set(s.ma_mon, s);
  }

  const requestedSubjects: RawSubject[] = [];
  for (const code of requestedSubjectCodes) {
    const s = subjectMap.get(code);
    if (s && s.lop.length > 0) {
      requestedSubjects.push(s);
    }
  }

  let bestSolution: { subject: RawSubject; cls: RawClass }[] = [];
  let bestScore = -Infinity;
  let maxScheduledCount = 0;

  function backtrack(
    index: number,
    currentChoice: { subject: RawSubject; cls: RawClass }[]
  ) {
    if (index === requestedSubjects.length) {
      const score = evaluatePreferenceScore(currentChoice, preferences);
      if (
        currentChoice.length > maxScheduledCount ||
        (currentChoice.length === maxScheduledCount && score > bestScore)
      ) {
        maxScheduledCount = currentChoice.length;
        bestScore = score;
        bestSolution = [...currentChoice];
      }
      return;
    }

    const currentSub = requestedSubjects[index];

    // Thử từng lớp của môn hiện tại
    for (const cls of currentSub.lop) {
      let conflict = false;
      for (const chosen of currentChoice) {
        if (classesOverlap(chosen.cls, cls).overlap) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        currentChoice.push({ subject: currentSub, cls });
        backtrack(index + 1, currentChoice);
        currentChoice.pop();
      }
    }

    // Nhánh bỏ qua môn này nếu muốn tìm phương án tối đa (partial)
    if (
      currentChoice.length + (requestedSubjects.length - index - 1) >=
      maxScheduledCount
    ) {
      backtrack(index + 1, currentChoice);
    }
  }

  backtrack(0, []);

  const selectedClassIds = bestSolution.map(
    (item) => `${item.subject.ma_mon}-${item.cls.nhom_to}`
  );

  return {
    solutionFound: bestSolution.length === requestedSubjects.length,
    selectedClassIds,
    score: bestScore,
  };
}
