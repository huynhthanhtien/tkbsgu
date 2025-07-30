export interface Subject{
  id: string,
  name: string,
  code: string,
  credit: number,
  classes: ClassInfo[]
}

export interface ScheduleItem {
  subjectId: string
  classId: string
  subjectName: string
  subjectCode: string
  color: string
  schedules: Array<{
    day: string
    startPeriod: number
    endPeriod: number
    teacher: string
    room: string
  }>
  credit: number
}

export interface ClassInfo {
  id: string
  color: string
  schedules: Array<{
    day: string
    startPeriod: number
    endPeriod: number
    teacher: string
    room: string
  }>
}
