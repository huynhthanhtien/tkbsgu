"use client"


import type React from "react"
// Reusable confirmation modal component
import type { ReactNode } from "react";
type ConfirmModalProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
};
function ConfirmModal({ open, title, description, onCancel, onConfirm, confirmText = "Xoá", cancelText = "Huỷ", confirmClass = "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <div className="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-600 dark:text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v-.008H12v.008zm9-7.5A9 9 0 11 3 12a9 9 0 0118 0z" />
          </svg>
          <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</div>
        </div>
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">{description}</div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold shadow ${confirmClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react"
import { Toaster, toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, X, Calendar } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// import { useSubjects } from "@/hooks/useSubjects";


import { ClassInfo, ScheduleItem } from "@/components/types"
import SubjectSelector from "@/components/ui/search";
import { useSubjects } from "@/context/SubjectsContext"
// Dữ liệu mẫu với nhiều khoảng thời gian cho mỗi lớp

// const selectedSubjects: Subject[] = [
//   {
//     id: "math",
//     name: "Toán Cao Cấp",
//     code: "MATH101",
//     classes: [
//       {
//         id: "math-1",
//         color: "blue",
//         schedules: [
//           { day: "Thứ 2", startPeriod: 1, endPeriod: 3, teacher: "TS. Nguyễn Văn A", room: "A101" },
//           { day: "Thứ 5", startPeriod: 2, endPeriod: 4, teacher: "TS. Nguyễn Văn A", room: "A101" },
//         ],
//       },
//       {
//         id: "math-2",
//         color: "green",
//         schedules: [
//           { day: "Thứ 3", startPeriod: 4, endPeriod: 6, teacher: "PGS. Trần Thị B", room: "A102" },
//           { day: "Thứ 6", startPeriod: 1, endPeriod: 2, teacher: "PGS. Trần Thị B", room: "A102" },
//         ],
//       },
//       {
//         id: "math-3",
//         color: "purple",
//         schedules: [
//           { day: "Thứ 4", startPeriod: 7, endPeriod: 10, teacher: "TS. Lê Văn C", room: "A103" },
//         ],
//       },
//     ],
//   },
//   {
//     id: "physics",
//     name: "Vật Lý Đại Cương",
//     code: "PHYS101",
//     classes: [
//       {
//         id: "physics-1",
//         color: "red",
//         schedules: [
//           { day: "Thứ 2", startPeriod: 4, endPeriod: 5, teacher: "TS. Phạm Văn D", room: "B201" },
//           { day: "Thứ 4", startPeriod: 1, endPeriod: 3, teacher: "TS. Phạm Văn D", room: "B201" },
//         ],
//       },
//       {
//         id: "physics-2",
//         color: "orange",
//         schedules: [
//           { day: "Thứ 3", startPeriod: 8, endPeriod: 10, teacher: "PGS. Hoàng Thị E", room: "B202" },
//           { day: "Thứ 7", startPeriod: 1, endPeriod: 3, teacher: "PGS. Hoàng Thị E", room: "B202" },
//         ],
//       },
//     ],
//   },
//   {
//     id: "chemistry",
//     name: "Hóa Học Đại Cương",
//     code: "CHEM101",
//     classes: [
//       {
//         id: "chemistry-1",
//         color: "teal",
//         schedules: [
//           { day: "Thứ 5", startPeriod: 6, endPeriod: 8, teacher: "TS. Vũ Văn F", room: "C301" },
//         ],
//       },
//       {
//         id: "chemistry-2",
//         color: "pink",
//         schedules: [
//           { day: "Thứ 6", startPeriod: 3, endPeriod: 5, teacher: "ThS. Đỗ Thị G", room: "C302" },
//           { day: "Chủ Nhật", startPeriod: 1, endPeriod: 2, teacher: "ThS. Đỗ Thị G", room: "C302" },
//         ],
//       },
//     ],
//   },
//   {
//     id: "english",
//     name: "Tiếng Anh",
//     code: "ENG101",
//     classes: [
//       {
//         id: "english-1",
//         color: "indigo",
//         schedules: [
//           { day: "Thứ 2", startPeriod: 6, endPeriod: 7, teacher: "ThS. Smith John", room: "D401" },
//           { day: "Thứ 4", startPeriod: 4, endPeriod: 6, teacher: "ThS. Smith John", room: "D401" },
//         ],
//       },
//     ],
//   },
// ]


const morningPeriods = [1, 2, 3, 4, 5]
const afternoonPeriods = [6, 7, 8, 9, 10]
// const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const weekDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]

// Màu sắc cho từng lớp (hỗ trợ dark mode) - Google Calendar style
const colorClasses = {
  blue: "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400",
  green: "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400",
  purple: "bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400",
  red: "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400",
  orange: "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 dark:border-orange-400",
  pink: "bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 dark:border-pink-400",
  teal: "bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 dark:border-teal-400",
  indigo: "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 dark:border-indigo-400",
}

const colorClassesText = {
  blue: "text-blue-700 dark:text-blue-300",
  green: "text-green-700 dark:text-green-300",
  purple: "text-purple-700 dark:text-purple-300",
  red: "text-red-700 dark:text-red-300",
  orange: "text-orange-700 dark:text-orange-300",
  pink: "text-pink-700 dark:text-pink-300",
  teal: "text-teal-700 dark:text-teal-300",
  indigo: "text-indigo-700 dark:text-indigo-300",
}

const colorClassesHighlight = {
  blue: "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600",
  green: "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600",
  purple: "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-600",
  red: "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-600",
  orange: "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600",
  pink: "bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-600",
  teal: "bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-600",
  indigo: "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600",
}



export default function SchedulePlanner() {

  // Bổ sung: Chọn lớp từ sidebar bằng click
  function handleSidebarClassClick(subject: any, cls: ClassInfo) {
    // Nếu đã chọn lớp này rồi thì không làm gì
    const isAlreadySelected = Object.values(schedule).some(
      (item) => item.subjectId === subject.id && item.classId === cls.id
    );
    if (isAlreadySelected) return;

    // Kiểm tra trùng slot với các môn khác
    let conflict = null;
    for (const sch of cls.schedules) {
      for (let p = sch.startPeriod; p <= sch.endPeriod; p++) {
        const scheduleKey = `${sch.day}-${p}`;
        const slotItem = schedule[scheduleKey];
        if (slotItem && slotItem.subjectId !== subject.id) {
          conflict = { day: sch.day, p, subjectName: slotItem.subjectName };
          break;
        }
      }
      if (conflict) break;
    }
    if (conflict) {
      toast.warning(`Không thể chọn lớp vì trùng với môn khác (${conflict.subjectName}, tiết ${conflict.p})!`);
      return;
    }

    // Xóa lớp cũ của môn học này nếu có
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach((key) => {
      if (newSchedule[key].subjectId === subject.id) {
        delete newSchedule[key];
      }
    });

    // Thêm tất cả các ô của lớp mới vào lịch, lưu cả credit
    cls.schedules.forEach((classSchedule) => {
      for (let p = classSchedule.startPeriod; p <= classSchedule.endPeriod; p++) {
        const scheduleKey = `${classSchedule.day}-${p}`;
        newSchedule[scheduleKey] = {
          subjectId: subject.id,
          classId: cls.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          color: cls.color,
          schedules: cls.schedules,
          credit: subject.credit ?? 0,
        };
      }
    });

    setSchedule(newSchedule);
    setDraggedSubject(null);
    setDraggedFromSchedule(null);
    setAvailableClasses([]);
    setHoveredSlot(null);
    setClassSelectionModal({ open: false, classes: [], day: '', period: 0, subject: null });
  }



  const { selectedSubjects, addSubject, removeSubject } = useSubjects();

  // State for custom confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, subject: any | null }>({ open: false, subject: null });

  const [schedule, setSchedule] = useState<{ [key: string]: ScheduleItem }>({});

  // Khôi phục schedule từ localStorage sau khi client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tkb-schedule');
        if (saved) setSchedule(JSON.parse(saved));
      } catch { }
    }
  }, []);

  // Lưu schedule vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tkb-schedule', JSON.stringify(schedule));
      } catch { }
    }
  }, [schedule]);
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null)
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([])
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  const [draggedFromSchedule, setDraggedFromSchedule] = useState<{
    subjectId: string
    classId: string
  } | null>(null)

  // Ẩn/hiện danh sách lớp cho từng môn học
  const [expandedSubjects, setExpandedSubjects] = useState<{ [subjectId: string]: boolean }>({});

  // Modal chọn lớp khi có nhiều lớp phù hợp
  const [classSelectionModal, setClassSelectionModal] = useState<{
    open: boolean,
    classes: ClassInfo[],
    day: string,
    period: number,
    subject: any | null
  }>({ open: false, classes: [], day: '', period: 0, subject: null })

  const handleDragStart = (e: React.DragEvent, subjectId: string) => {
    setDraggedSubject(subjectId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", subjectId)

    // Tìm tất cả lớp của môn học này
    const subject = selectedSubjects.find((s) => s.id === subjectId)
    if (subject) {
      setAvailableClasses(subject.classes)
    }
  }

  const handleScheduleDragStart = (e: React.DragEvent, subjectId: string, classId: string) => {
    setDraggedFromSchedule({ subjectId, classId })
    setDraggedSubject(subjectId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", `schedule-${subjectId}-${classId}`)

    // Tìm tất cả lớp của môn học này
    const subject = selectedSubjects.find((s) => s.id === subjectId)
    if (subject) {
      setAvailableClasses(subject.classes.filter((cls) => cls.id !== classId)) // Loại bỏ lớp hiện tại
    }
  }

  const handleDragEnd = () => {
    setDraggedSubject(null)
    setDraggedFromSchedule(null)
    setAvailableClasses([])
    setHoveredSlot(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e: React.DragEvent, day: string, period: number) => {
    e.preventDefault()
    if (draggedSubject) {
      setHoveredSlot(`${day}-${period}`)
    }
  }

  const handleDrop = (e: React.DragEvent, day: string, period: number) => {
    e.preventDefault()

    if (!draggedSubject) return

    const subject = selectedSubjects.find((s) => s.id === draggedSubject)
    if (!subject) return



    // Xác định tất cả lớp phù hợp với slot đang thả
    const conflictCheckClasses = subject.classes.filter((cls) =>
      cls.schedules.some(
        (schedule) => schedule.day === day && period >= schedule.startPeriod && period <= schedule.endPeriod,
      ),
    );

    // Nếu có lớp phù hợp, kiểm tra trùng slot cho từng lớp phù hợp
    let conflict = null;
    for (const cls of conflictCheckClasses) {
      for (const sch of cls.schedules) {
        if (sch.day === day && period >= sch.startPeriod && period <= sch.endPeriod) {
          for (let p = sch.startPeriod; p <= sch.endPeriod; p++) {
            const key = `${day}-${p}`;
            const slotItem = schedule[key];
            if (slotItem && slotItem.subjectId !== draggedSubject) {
              conflict = { day, p, subjectName: slotItem.subjectName };
              break;
            }
          }
        }
        if (conflict) break;
      }
      if (conflict) break;
    }
    if (conflict) {
      console.log('CONFLICT_DROP', conflict);
      setTimeout(() => {
        toast.warning(`Không thể kéo vào ô đã có môn khác (${conflict.subjectName}, tiết ${conflict.p})!`);
      }, 0);
      setDraggedSubject(null);
      setDraggedFromSchedule(null);
      setAvailableClasses([]);
      setHoveredSlot(null);
      return;
    }

    // Tìm tất cả lớp có chứa ô này trong lịch học
    const matchingClasses = subject.classes.filter((cls) =>
      cls.schedules.some(
        (schedule) => schedule.day === day && period >= schedule.startPeriod && period <= schedule.endPeriod,
      ),
    )

    if (matchingClasses.length === 0) {
      toast.error(`Môn ${subject.name} không có lớp nào vào ${day}, tiết ${period}`)
      setDraggedSubject(null)
      setDraggedFromSchedule(null)
      setAvailableClasses([])
      setHoveredSlot(null)
      return
    }

    // Nếu có nhiều lớp phù hợp, hỏi người dùng chọn lớp
    if (matchingClasses.length > 1) {
      setClassSelectionModal({ open: true, classes: matchingClasses, day, period, subject })
      return
    }

    // Nếu chỉ có 1 lớp phù hợp
    const matchingClass = matchingClasses[0]

    // Nếu đang drag từ schedule và chọn cùng lớp, không làm gì
    if (draggedFromSchedule && matchingClass.id === draggedFromSchedule.classId) {
      setDraggedSubject(null)
      setDraggedFromSchedule(null)
      setAvailableClasses([])
      setHoveredSlot(null)
      return
    }

    // Xóa lớp cũ của môn học này nếu có
    const newSchedule = { ...schedule }
    Object.keys(newSchedule).forEach((key) => {
      if (newSchedule[key].subjectId === draggedSubject) {
        delete newSchedule[key]
      }
    })

    // Thêm tất cả các ô của lớp mới vào lịch, lưu cả credit
    matchingClass.schedules.forEach((classSchedule) => {
      for (let p = classSchedule.startPeriod; p <= classSchedule.endPeriod; p++) {
        const scheduleKey = `${classSchedule.day}-${p}`
        newSchedule[scheduleKey] = {
          subjectId: draggedSubject,
          classId: matchingClass.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          color: matchingClass.color,
          schedules: matchingClass.schedules,
          credit: subject.credit ?? 0,
        }
      }
    })

    setSchedule(newSchedule)
    setDraggedSubject(null)
    setDraggedFromSchedule(null)
    setAvailableClasses([])
    setHoveredSlot(null)
  }

  // Hàm xử lý khi chọn lớp từ modal
  const handleSelectClassFromModal = (cls: ClassInfo) => {
    if (!classSelectionModal.subject) return
    const subject = classSelectionModal.subject
    const day = classSelectionModal.day
    const period = classSelectionModal.period

    // Nếu đang drag từ schedule và chọn cùng lớp, không làm gì
    if (draggedFromSchedule && cls.id === draggedFromSchedule.classId) {
      setDraggedSubject(null)
      setDraggedFromSchedule(null)
      setAvailableClasses([])
      setHoveredSlot(null)
      setClassSelectionModal({ open: false, classes: [], day: '', period: 0, subject: null })
      return
    }

    // Xóa lớp cũ của môn học này nếu có
    const newSchedule = { ...schedule }
    Object.keys(newSchedule).forEach((key) => {
      if (newSchedule[key].subjectId === subject.id) {
        delete newSchedule[key]
      }
    })

    // Thêm tất cả các ô của lớp mới vào lịch, lưu cả credit
    cls.schedules.forEach((classSchedule) => {
      for (let p = classSchedule.startPeriod; p <= classSchedule.endPeriod; p++) {
        const scheduleKey = `${classSchedule.day}-${p}`
        newSchedule[scheduleKey] = {
          subjectId: subject.id,
          classId: cls.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          color: cls.color,
          schedules: cls.schedules,
          credit: subject.credit ?? 0,
        }
      }
    })

    setSchedule(newSchedule)
    setDraggedSubject(null)
    setDraggedFromSchedule(null)
    setAvailableClasses([])
    setHoveredSlot(null)
    setClassSelectionModal({ open: false, classes: [], day: '', period: 0, subject: null })
  }

  const removeFromSchedule = (classId: string) => {
    const newSchedule = { ...schedule }
    Object.keys(newSchedule).forEach((key) => {
      if (newSchedule[key].classId === classId) {
        delete newSchedule[key]
      }
    })
    setSchedule(newSchedule)
  }

  // Lấy thông tin lớp cho ô hiện tại khi đang kéo
  const getClassForSlot = (period: number, day: string) => {
    if (!draggedSubject) return null

    return availableClasses.find((cls) =>
      cls.schedules.some(
        (schedule) => schedule.day === day && period >= schedule.startPeriod && period <= schedule.endPeriod,
      ),
    )
  }

  // Kiểm tra xem ô có thuộc về lớp nào không
  const hasAvailableClass = (period: number, day: string) => {
    if (!draggedSubject) return false
    return availableClasses.some((cls) =>
      cls.schedules.some(
        (schedule) => schedule.day === day && period >= schedule.startPeriod && period <= schedule.endPeriod,
      ),
      // null
    )
  }

  // Tạo merged schedule - DÙNG DATA GỐC
  const createMergedSchedule = () => {
    const mergedSchedule: { [key: string]: any } = {}

    // Đảm bảo mỗi classId lấy đúng schedules của lớp đã chọn
    const processedClasses = new Set<string>()

    Object.values(schedule).forEach((item) => {
      if (processedClasses.has(item.classId)) return
      processedClasses.add(item.classId)

      // Tìm đúng schedules của classId này trong selectedSubjects
      let classInfo: ClassInfo | undefined
      const subject = selectedSubjects.find((s) => s.id === item.subjectId)
      if (subject) {
        classInfo = subject.classes.find((cls) => cls.id === item.classId)
      }
      const schedulesArr = classInfo ? classInfo.schedules : item.schedules

      schedulesArr.forEach((classSchedule) => {
        const key = `${item.classId}-${classSchedule.day}-${classSchedule.startPeriod}-${classSchedule.endPeriod}`
        mergedSchedule[key] = {
          ...item,
          startPeriod: classSchedule.startPeriod,
          endPeriod: classSchedule.endPeriod,
          day: classSchedule.day,
          teacher: classSchedule.teacher,
          room: classSchedule.room,
          span: classSchedule.endPeriod - classSchedule.startPeriod + 1,
        }
      })
    })

    return mergedSchedule
  }

  const mergedSchedule = createMergedSchedule()

  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        {/* Modal chọn lớp nếu có nhiều lớp phù hợp */}
        {classSelectionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
              <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Chọn lớp cho môn {classSelectionModal.subject?.name}</div>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Có nhiều lớp trùng thời gian, hãy chọn lớp muốn xếp:</div>
              <div className="space-y-3">
                {classSelectionModal.classes.map((cls) => (
                  <div key={cls.id} className={`p-3 rounded border flex flex-col gap-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 ${colorClasses[cls.color as keyof typeof colorClasses]}`}
                    onClick={() => handleSelectClassFromModal(cls)}
                  >
                    <div className="font-medium text-base">Lớp {cls.id.split("-")[1]} - {cls.id}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Giáo viên: {cls.schedules[0]?.teacher || "-"} | Phòng: {cls.schedules[0]?.room || "-"}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {cls.schedules.map((sch, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          {sch.day} tiết {sch.startPeriod}-{sch.endPeriod}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setClassSelectionModal({ open: false, classes: [], day: '', period: 0, subject: null })}>Hủy</button>
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Thời Khóa Biểu</h1>
            <ThemeToggle />
          </div>

          <SubjectSelector />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Danh sách môn học */}
            <div className="lg:col-span-1 h-full flex flex-col">
              <Card className="shadow-sm bg-white dark:bg-gray-950 h-full flex flex-col">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5" />
                    Danh Sách Môn Học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Kéo môn học vào thời khóa biểu để chọn lớp
                  </div>
                  <div className="overflow-y-auto space-y-2">
                    {[...selectedSubjects].reverse().map((subject) => (
                      <div
                        key={subject.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, subject.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-move hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 ${draggedSubject === subject.id ? "opacity-50 scale-95" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</div>
                          <button
                            className="ml-2 p-1 rounded hover:bg-red-700/20 dark:hover:bg-red-700/30 transition"
                            title="Xoá tất cả lớp của môn này khỏi thời khoá biểu"
                            onClick={() => setConfirmDelete({ open: true, subject })}
                          >
                            {/* Trash icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-700 dark:text-red-300">
                              <path fillRule="evenodd" d="M7.5 3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4h3.25a.75.75 0 0 1 0 1.5h-.278l-.427 8.12A2.75 2.75 0 0 1 12.3 16.25H7.7a2.75 2.75 0 0 1-2.745-2.63l-.427-8.12H4.25a.75.75 0 0 1 0-1.5H7.5V3Zm1 .5V4h3v-.5h-3Zm-2.18 1.5.42 8.01a1.25 1.25 0 0 0 1.245 1.19h4.6a1.25 1.25 0 0 0 1.245-1.19l.42-8.01H6.32Z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {/* Confirmation modal for subject deletion (root level) */}
                          <ConfirmModal
                            open={confirmDelete.open && !!confirmDelete.subject}
                            title="Xác nhận xoá môn học"
                            description={confirmDelete.subject ? (
                              <span>Bạn có chắc muốn xoá môn <span className="font-bold text-red-600 dark:text-red-400">&apos;{confirmDelete.subject.name}&apos;</span> khỏi danh sách môn học và thời khoá biểu không?</span>
                            ) : ''}
                            onCancel={() => setConfirmDelete({ open: false, subject: null })}
                            onConfirm={() => {
                              const subject = confirmDelete.subject;
                              if (!subject) return;
                              // Xoá khỏi schedule
                              const newSchedule = { ...schedule };
                              Object.keys(newSchedule).forEach((key) => {
                                if (newSchedule[key].subjectId === subject.id) {
                                  delete newSchedule[key];
                                }
                              });
                              setSchedule(newSchedule);
                              // Xoá khỏi danh sách môn học nếu context cho phép
                              removeSubject(subject.id);
                              toast.success(`Đã xoá môn '${subject.name}' khỏi danh sách và thời khoá biểu!`);
                              setConfirmDelete({ open: false, subject: null });
                            }}
                          />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{subject.code}</div>
                        <div
                          className="text-xs text-gray-500 dark:text-gray-500 mt-2 cursor-pointer select-none"
                          onClick={() => setExpandedSubjects(prev => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                          title="Nhấn để ẩn/hiện danh sách lớp"
                        >
                          {subject.classes.length} lớp có sẵn {expandedSubjects[subject.id] ? '▲' : '▼'}
                        </div>

                        {/* Hiển thị thông tin các lớp */}
                        {expandedSubjects[subject.id] && (
                          <div className="mt-3 space-y-2">
                            {subject.classes.map((cls) => (
                              <div
                                key={cls.id}
                                className={`text-xs p-2 rounded-md transition-all duration-200 cursor-pointer ${colorClasses[cls.color as keyof typeof colorClasses]}`}
                                onClick={() => handleSidebarClassClick(subject, cls)}
                                title="Nhấn để chọn lớp này cho thời khóa biểu"
                              >
                                <div className="font-medium mb-1">
                                  Nhóm tổ {cls.id.split("-")[1]} - {cls.id}
                                </div>
                                {cls.schedules.map((schedule, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs opacity-80">
                                    <Calendar className="w-3 h-3" />
                                    <span>{schedule.day}</span>
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Tiết {schedule.startPeriod}-{schedule.endPeriod}
                                    </span>
                                  </div>
                                ))}
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold underline">Chọn lớp này</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lưới thời khóa biểu - Google Calendar Style */}
            <div id="schedule-card-full-capture" className="lg:col-span-3">
              <Card className="shadow-sm bg-white dark:bg-gray-950">
                <CardHeader className="pb-0 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Thời Khóa Biểu</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20">
                      {(() => {
                        // Lấy các subjectId đã xếp trong schedule
                        const scheduledSubjectIds = Array.from(new Set(Object.values(schedule).map(item => item.subjectId)));
                        // Lấy các credit duy nhất từ schedule
                        const credits = new Set();
                        let total = 0;
                        for (const subjectId of scheduledSubjectIds) {
                          // Tìm 1 block bất kỳ của subjectId này trong schedule
                          const block = Object.values(schedule).find(item => item.subjectId === subjectId && typeof item.credit === 'number');
                          if (block && !credits.has(subjectId)) {
                            total += block.credit;
                            credits.add(subjectId);
                          }
                        }
                        return `Tín chỉ: ${total}`;
                      })()}
                    </div>
                    <button
                      className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-lg flex items-center justify-center"
                      aria-label="Chụp ảnh thời khóa biểu"
                      onClick={async () => {
                        if (typeof window === 'undefined') return;
                        const { toPng } = await import('html-to-image');
                        // Chụp cả khung lớn (bao gồm tín chỉ, tiêu đề, nút chụp)
                        const card = document.getElementById('schedule-card-full-capture');
                        if (card) {
                          try {
                            // Tăng chất lượng ảnh bằng pixelRatio cao hơn (2 hoặc 3 tuỳ nhu cầu)
                            const dataUrl = await toPng(card as HTMLElement, { backgroundColor: undefined, pixelRatio: 3 });
                            if (navigator.clipboard && window.ClipboardItem) {
                              const res = await fetch(dataUrl);
                              const blob = await res.blob();
                              await navigator.clipboard.write([
                                new window.ClipboardItem({ 'image/png': blob })
                              ]);
                              toast.success('Đã sao chép ảnh thời khóa biểu vào clipboard!');
                            } else {
                              const link = document.createElement('a');
                              link.download = 'thoi-khoa-bieu.png';
                              link.href = dataUrl;
                              link.click();
                            }
                          } catch (err) {
                            toast.error('Không thể chụp ảnh hoặc copy clipboard.');
                          }
                        }
                      }}
                    >
                      {/* Camera icon SVG */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75V8.25A2.25 2.25 0 014.5 6h2.379a1.5 1.5 0 001.342-.832l.948-1.895A1.5 1.5 0 0110.382 2.25h3.236a1.5 1.5 0 011.213.623l.948 1.895A1.5 1.5 0 0017.121 6H19.5a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0119.5 18h-15a2.25 2.25 0 01-2.25-2.25z" />
                        <circle cx="12" cy="13" r="3.25" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      {/* Header - Google Calendar style */}
                      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                          Tiết
                        </div>
                        {weekDays.map((day) => (
                          <div
                            key={day}
                            className="p-4 text-sm font-medium text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Time slots với divider giữa buổi sáng và chiều */}
                      <div className="relative">
                        {/* Buổi sáng (1-5) */}
                        {morningPeriods.map((period, periodIndex) => (
                          <div
                            key={period}
                            className={`grid grid-cols-8 h-[60px] border-b border-gray-100 dark:border-gray-700`}
                          >
                            {/* Time label */}
                            <div className="p-4 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex items-center bg-gray-50/50 dark:bg-gray-800/50">
                              <span className="font-medium">Tiết {period}</span>
                            </div>

                            {/* Day columns */}
                            {weekDays.map((day, dayIndex) => {
                              const scheduleKey = `${day}-${period}`
                              const classForSlot = getClassForSlot(period, day)
                              const hasClass = hasAvailableClass(period, day)
                              const isHovered = hoveredSlot === scheduleKey

                              return (
                                <div
                                  key={scheduleKey}
                                  className={`relative border-r border-gray-100 dark:border-gray-700 last:border-r-0 h-[60px] transition-colors duration-200 ${classForSlot && draggedSubject
                                    ? `${colorClassesHighlight[classForSlot.color as keyof typeof colorClassesHighlight]} opacity-60`
                                    : hasClass && draggedSubject
                                      ? "bg-blue-50 dark:bg-blue-950/30"
                                      : isHovered && draggedSubject
                                        ? "bg-blue-100 dark:bg-blue-900/50"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                    }`}
                                  onDragOver={handleDragOver}
                                  onDragEnter={(e) => handleDragEnter(e, day, period)}
                                  onDrop={(e) => handleDrop(e, day, period)}
                                >
                                  {draggedSubject && (() => {
                                    // Đếm số lớp khả dụng cho slot này
                                    const subject = selectedSubjects.find((s) => s.id === draggedSubject)
                                    let matchingClasses: ClassInfo[] = []
                                    if (subject) {
                                      matchingClasses = subject.classes.filter((cls) =>
                                        cls.schedules.some(
                                          (schedule) => schedule.day === day && period >= schedule.startPeriod && period <= schedule.endPeriod,
                                        )
                                      )
                                    }
                                    if (matchingClasses.length === 1) {
                                      const cls = matchingClasses[0]
                                      return (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                                          <div className={`text-xs font-medium ${colorClassesText[cls.color as keyof typeof colorClassesText]}`}>Lớp {cls.id.split("-")[1]}</div>
                                          <div className={`text-xs ${colorClassesText[cls.color as keyof typeof colorClassesText]} opacity-80`}>{cls.schedules[0]?.room ? `phòng ${cls.schedules[0].room}` : "phòng"}</div>
                                        </div>
                                      )
                                    } else if (matchingClasses.length > 1) {
                                      // Lấy danh sách tên lớp (Lớp 8 | Lớp 10)
                                      const classNames = matchingClasses.map(cls => `Lớp ${cls.id.split("-")[1]}`).join(" | ")
                                      return (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            {classNames}
                                          </div>
                                        </div>
                                      )
                                    } else if (hasClass) {
                                      return (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Có lớp khả dụng</div>
                                        </div>
                                      )
                                    }
                                    return null
                                  })()}
                                </div>
                              )
                            })}
                          </div>
                        ))}

                        {/* DIVIDER GIỮA BUỔI SÁNG VÀ BUỔI CHIỀU */}
                        <div className="grid grid-cols-8 h-[40px] bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                          <div className="flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600">
                            Nghỉ trưa
                          </div>
                          {weekDays.map((day) => (
                            <div
                              key={`break-${day}`}
                              className="border-r border-gray-200 dark:border-gray-600 last:border-r-0 flex items-center justify-center"
                            >
                              <div className="w-full h-[2px] bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 opacity-50"></div>
                            </div>
                          ))}
                        </div>

                        {/* Buổi chiều (6-10) */}
                        {afternoonPeriods.map((period, periodIndex) => (
                          <div
                            key={period}
                            className={`grid grid-cols-8 h-[60px] ${periodIndex !== afternoonPeriods.length - 1
                              ? "border-b border-gray-100 dark:border-gray-700"
                              : ""
                              }`}
                          >
                            {/* Time label */}
                            <div className="p-4 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex items-center bg-gray-50/50 dark:bg-gray-800/50">
                              <span className="font-medium">Tiết {period}</span>
                            </div>

                            {/* Day columns */}
                            {weekDays.map((day, dayIndex) => {
                              const scheduleKey = `${day}-${period}`
                              const classForSlot = getClassForSlot(period, day)
                              const hasClass = hasAvailableClass(period, day)
                              const isHovered = hoveredSlot === scheduleKey

                              return (
                                <div
                                  key={scheduleKey}
                                  className={`relative border-r border-gray-100 dark:border-gray-700 last:border-r-0 h-[60px] transition-colors duration-200 ${classForSlot && draggedSubject
                                    ? `${colorClassesHighlight[classForSlot.color as keyof typeof colorClassesHighlight]} opacity-60`
                                    : hasClass && draggedSubject
                                      ? "bg-blue-50 dark:bg-blue-950/30"
                                      : isHovered && draggedSubject
                                        ? "bg-blue-100 dark:bg-blue-900/50"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                    }`}
                                  onDragOver={handleDragOver}
                                  onDragEnter={(e) => handleDragEnter(e, day, period)}
                                  onDrop={(e) => handleDrop(e, day, period)}
                                >
                                  {draggedSubject && (() => {
                                    // Đếm số lớp khả dụng cho slot này
                                    const subject = selectedSubjects.find((s) => s.id === draggedSubject)
                                    let matchingClasses: ClassInfo[] = []
                                    if (subject) {
                                      matchingClasses = subject.classes.filter((cls) =>
                                        cls.schedules.some(
                                          (schedule) => schedule.day === day && period >= schedule.startPeriod && period <= schedule.endPeriod,
                                        )
                                      )
                                    }
                                    if (matchingClasses.length === 1) {
                                      const cls = matchingClasses[0]
                                      return (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                                          <div className={`text-xs font-medium ${colorClassesText[cls.color as keyof typeof colorClassesText]}`}>Lớp {cls.id.split("-")[1]}</div>
                                          <div className={`text-xs ${colorClassesText[cls.color as keyof typeof colorClassesText]} opacity-80`}>{cls.schedules[0]?.room ? `phòng ${cls.schedules[0].room}` : "phòng"}</div>
                                        </div>
                                      )
                                    } else if (matchingClasses.length > 1) {
                                      // Lấy danh sách tên lớp (Lớp 8 | Lớp 10)
                                      const classNames = matchingClasses.map(cls => `Lớp ${cls.id.split("-")[1]}`).join(" | ")
                                      return (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            {classNames}
                                          </div>
                                        </div>
                                      )
                                    } else if (hasClass) {
                                      return (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Có lớp khả dụng</div>
                                        </div>
                                      )
                                    }
                                    return null
                                  })()}
                                </div>
                              )
                            })}
                          </div>
                        ))}

                        {/* Render events - LOGIC ĐƠN GIẢN với tính toán divider */}
                        {Object.entries(mergedSchedule).map(([key, block]: [string, any]) => {
                          const dayIndex = weekDays.indexOf(block.day)
                          const timeColumnWidth = 12.5
                          const dayColumnWidth = 12.5
                          const cellHeight = 60
                          const headerHeight = 1
                          const dividerHeight = 40 // Chiều cao của divider

                          const left = timeColumnWidth + dayIndex * dayColumnWidth

                          // LOGIC ĐƠN GIẢN với tính toán divider
                          // LOGIC CŨ - SAI
                          // let top = headerHeight + (block.startPeriod - 1) * cellHeight

                          // // Nếu event bắt đầu từ tiết 6 trở đi, cộng thêm chiều cao divider
                          // if (block.startPeriod >= 6) {
                          //   top += dividerHeight
                          // }

                          // LOGIC MỚI - ĐÚNG
                          let top = headerHeight

                          if (block.startPeriod <= 5) {
                            // Tiết 1-5: header + periods trước đó
                            top += (block.startPeriod - 1) * cellHeight
                          } else {
                            // Tiết 6-10: header + 5 periods sáng + divider + periods chiều
                            top += 5 * cellHeight + dividerHeight + (block.startPeriod - 6) * cellHeight
                          }

                          let height = block.span * cellHeight - 1

                          // Nếu event cross qua divider (từ tiết 5 sang tiết 6), cộng thêm chiều cao divider
                          if (block.startPeriod <= 5 && block.endPeriod >= 6) {
                            height += dividerHeight
                          }

                          const width = dayColumnWidth - 0.2
                          console.log("bl", block);
                          return (
                            <div
                              key={key}
                              draggable
                              onDragStart={(e) => handleScheduleDragStart(e, block.subjectId, block.classId)}
                              onDragEnd={handleDragEnd}
                              title={`${block.subjectCode} - Tiết ${block.startPeriod}-${block.endPeriod}`}
                              className={`absolute rounded-lg p-2 group cursor-move shadow-sm hover:shadow-md transition-all duration-200 ${colorClasses[block.color as keyof typeof colorClasses]
                                } ${draggedFromSchedule?.classId === block.classId ? "opacity-50 scale-95" : ""}`}
                              style={{
                                left: `${left}%`,
                                top: `${top}px`,
                                width: `${width}%`,
                                height: `${height}px`,
                                zIndex: 10,
                              }}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFromSchedule(block.classId)
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <div
                                className={`text-sm font-semibold ${colorClassesText[block.color as keyof typeof colorClassesText]}`}
                              >
                                {block.classId}
                              </div>
                              <div
                                className={`text-xs ${colorClassesText[block.color as keyof typeof colorClassesText]} opacity-90`}
                              >
                                {/* code */}

                                {block.subjectName}
                              </div>
                              <div
                                className={`text-xs ${colorClassesText[block.color as keyof typeof colorClassesText]} opacity-90`}
                              >
                                {/* code */}

                                {block.teacher}
                              </div>
                              <div
                                className={`text-xs ${colorClassesText[block.color as keyof typeof colorClassesText]} opacity-80`}
                              >
                                {block.room}
                              </div>
                              {/* {block.span > 1 && (
                              <div
                                className={`text-xs mt-1 ${colorClassesText[block.color as keyof typeof colorClassesText]} opacity-70`}
                              >
                                Tiết {block.startPeriod}-{block.endPeriod}
      </div>
    </>
                              </div>
                            )} */}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Thống kê */}
          {/* <div className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Thống Kê Thời Khóa Biểu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Object.keys(schedule).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tiết học đã xếp</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {new Set(Object.values(schedule).map((item) => item.subjectId)).size}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Môn học đã đăng ký</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(() => {
                      // Lấy các subjectId đã xếp trong schedule
                      const scheduledSubjectIds = Array.from(new Set(Object.values(schedule).map(item => item.subjectId)));
                      // Lấy các credit duy nhất từ schedule
                      const credits = new Set();
                      let total = 0;
                      for (const subjectId of scheduledSubjectIds) {
                        // Tìm 1 block bất kỳ của subjectId này trong schedule
                        const block = Object.values(schedule).find(item => item.subjectId === subjectId && typeof item.credit === 'number');
                        if (block && !credits.has(subjectId)) {
                          total += block.credit;
                          credits.add(subjectId);
                        }
                      }
                      return total;
                    })()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tổng số tín chỉ đã chọn</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
        </div>
      </div>
    </>
  )
}
