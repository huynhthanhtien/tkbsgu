import { deflateSync, inflateSync } from "zlib";
import { ClassInfo, ScheduleItem, Subject } from "@/components/types"
import { getSubjectById } from "@/components/ui/search"
import { crc32 } from "crc";
import base91 from "node-base91";

export class Compressor {

  static encode<T>(data: T): string {
    const json = Buffer.from(JSON.stringify(data), "utf-8");
    const compressed = deflateSync(json);
    // mã hoá base91 rồi encodeURIComponent để an toàn trong URL
    return (base91.encode(Buffer.from(compressed)));
  }

  static decode<T>(encoded: string): T {
    // decodeURIComponent rồi giải mã base91
    const buffer = base91.decode((encoded));
    const decompressed = inflateSync(buffer);
    return JSON.parse(decompressed.toString("utf-8")) as T;
  }


  static copyCurrentUrlWithChecksum(code: string):boolean {
    const checksum = crc32(code).toString(16).padStart(8, "0");
    const currentUrl = window.location.origin;
    const newUrl = `${currentUrl}/?code=${encodeURIComponent(code)}&checksum=${checksum}`;

    navigator.clipboard.writeText(newUrl).then(() => {
      // console.log("Đã copy:", newUrl);
    });
    return true;
  }

  static verifyUrl(code: string, checksum: string) {
    const expected = crc32(code).toString(16).padStart(8, "0");
    return expected === checksum.toLowerCase();
  }
}

export function TkbsDecode(subject: string[], listScheduleId: string[]): {
  Sub: Subject[],
  ScheduleItem: { [key: string]: ScheduleItem },
} {
  let schedule: { [key: string]: ScheduleItem } = {};

  const listSub: Subject[] = [];
  subject.forEach((val, index) => {
    listSub.push(getSubjectById(val));
  })

  listScheduleId.forEach((val, index) => {
    const [id] = val.split("-");
    const subject = listSub.find((item: Subject) => item.id === id);
    if (!subject) {
      throw new Error(`Subject with id ${id} not found`);
    }
    const classInfor = subject.classes.find((item: ClassInfo) => item.id === val);
    if (!classInfor) {
      throw new Error(`not fonnd`);
    }
    schedule = TkbDecode(schedule, subject, classInfor);
  })
  const data = {
    Sub: listSub,
    ScheduleItem: schedule,
  }
  return data;
  // console.log("testData", testData);
}

function TkbDecode(schedule: { [key: string]: ScheduleItem }, subject: Subject, cls: ClassInfo) {
  // let schedule: { [key: string]: ScheduleItem } = {};
  const newSchedule = { ...schedule };
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
  return newSchedule;
}

