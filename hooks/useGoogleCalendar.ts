
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const createNewCalendar = async (token: string, calendarName: string): Promise<string> => {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ summary: calendarName, timeZone: 'Asia/Ho_Chi_Minh' }),
  });

  if (!response.ok) throw new Error('Error creating calendar');
  const data = await response.json();
  return data.id;
};

export interface GoogleCalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };
  colorId?: number;
  visibility?: 'default' | 'public' | 'private';
  recurrence?: string[];
}

export const addEventToCalendar = async (
  token: string,
  calendarId: string,
  event: GoogleCalendarEvent
): Promise<any> => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) throw new Error(`Failed to add event: ${response.statusText}`);
  return await response.json();
};

export interface ScheduleJson {
  ten_mon: string;
  ma_mon: string;
  nhom_to: string;
  gv: string;
  phong: string;
  tbd: string; // tiết bắt đầu (string dạng số)
  so_tiet: string; // số tiết (string dạng số)
  tooltip: string; // chứa ngày bắt đầu - kết thúc (VD: "Từ 01/09/2025 đến 31/12/2025")
}

export const parseScheduleToEvent = (json: ScheduleJson): GoogleCalendarEvent => {
  const arr_start_time = [
    "00:00", "07:00", "07:50", "09:00", "09:50", "10:40", 
    "13:00", "13:50", "15:00", "15:50", "16:40", 
    "17:40", "18:30", "19:20"
  ];
  const arr_end_time = [
    "00:00", "07:50", "08:40", "09:50", "10:40", "11:30", 
    "13:50", "14:40", "15:50", "16:40", "17:30", 
    "18:30", "19:20", "20:10"
  ];

  const tbd = parseInt(json.tbd);
  const tkt = tbd + parseInt(json.so_tiet) - 1;

  const dateRange = json.tooltip.match(/(\d{2})\/(\d{2})\/(\d{2})/g);

  if (!dateRange || dateRange.length < 2) {
    throw new Error('Invalid date range format');
  }

  // Chuyển "23/09/25" thành "2025-09-23"
  const parseDate = (ddmmyy: string): Date => {
    const [dd, mm, yy] = ddmmyy.split('/');
    const fullYear = parseInt(yy) < 50 ? '20' + yy : '19' + yy; // Giả sử < 50 là 2000s
    return new Date(`${fullYear}-${mm}-${dd}`);
  };

  const startDate = parseDate(dateRange[0]);
  const endDate = parseDate(dateRange[1]);

  const start = new Date(startDate);
  const [startHour, startMinute] = arr_start_time[tbd].split(':').map(Number);
  start.setHours(startHour, startMinute);

  const end = new Date(startDate);
  const [endHour, endMinute] = arr_end_time[tkt].split(':').map(Number);
  end.setHours(endHour, endMinute);

  endDate.setHours(23, 59); // Cho RRULE

  return {
    summary: json.ten_mon,
    location: json.phong,
    description: `Mã môn học: ${json.ma_mon}\nNhóm tổ: ${json.nhom_to}\nGiáo viên: ${json.gv}`,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 30 }],
    },
    colorId: getRandomInt(1, 11),
    visibility: 'private',
    recurrence: [
      `RRULE:FREQ=WEEKLY;UNTIL=${endDate.toISOString().replace(/[-:]|(\.000Z)/g, '')}Z`
    ],
  };
};
