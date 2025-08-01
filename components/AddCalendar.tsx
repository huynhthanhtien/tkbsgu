'use client';

import React from 'react';
import { CalendarPlus } from "lucide-react";
import {
    createNewCalendar,
    addEventToCalendar,
    parseScheduleToEvent,
    ScheduleJson
} from '@/hooks/useGoogleCalendar';
import { Button } from "@/components/ui/button"

import { ScheduleItem } from "@/components/types";
import rawData from "@/public/data.json"; // ⚠️ Đặt file JSON trong `src/data/`, không phải `public/`
import { Toaster, toast } from "sonner"
import { start } from 'repl';

// export interface ScheduleJson {
//     ten_mon: string;
//     ma_mon: string;
//     nhom_to: string;
//     gv: string;
//     phong: string;
//     tbd: string;         // tiết bắt đầu
//     so_tiet: string;     // số tiết
//     tooltip: string;     // ví dụ: "Từ 01/09/2025 đến 31/12/2025"
// }

export async function logout(token: string): Promise<void> {
    try {
        const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
            method: "POST",
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to revoke token. Status: ${res.status}. Message: ${errorText}`);
        }

        console.log("Token successfully revoked");
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
}


function parseTKB(tkb: any[], monHoc: any, nhom_to: string, index: number): ScheduleJson[] {
    return tkb.map((item: any): ScheduleJson => {
        // const [startDate, endDate] = item.ngay
        //     .split(" đến ")
        //     .map((s: string) => s.trim());
        const matches = item.ngay.match(/\d{2}\/\d{2}\/\d{2}/g) || [];
        const startDate = matches[0]
        const endDate = matches.length >= 2 ? matches[1] : startDate;

        return {
            ten_mon: monHoc.ten_mon,
            ma_mon: monHoc.ma_mon,
            nhom_to: nhom_to,
            gv: item.giang_vien.replace(/^GV\s+/i, ""),
            phong: item.phong,
            tbd: String(item.tbd),
            so_tiet: String(item.tkt - item.tbd + 1),
            colorID: (index % 11 + 1),
            tooltip: `Từ ${startDate} đến ${endDate}`
        };
    });
}

function get_info_class(key: string, index: number): ScheduleJson[] | null {
    const [ma_mon, nhom_to] = key.split("-");

    const mon = rawData.find((item) => item.ma_mon === ma_mon);
    if (!mon) {
        console.error(`Không tìm thấy mã môn: ${ma_mon}`);
        return null;
    }

    const lop = mon.lop.find((l: any) => l.nhom_to === nhom_to);
    if (!lop) {
        console.error(`Không tìm thấy nhóm tổ: ${nhom_to} trong môn ${ma_mon}`);
        return null;
    }

    return parseTKB(lop.tkb, mon, nhom_to, index);
}

function openGoogleLogin(): Promise<string | null> {
    return new Promise((resolve) => {
        const width = 500;
        const height = 600;

        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const popup = window.open(
            "https://flask-api-lr7k.onrender.com",
            "_blank",
            `width=${width},height=${height},left=${left},top=${top},popup`
        );

        window.addEventListener("message", function handleMessage(event) {
            if (event.origin !== "https://flask-api-lr7k.onrender.com") return;

            const { access_token, user_info } = event.data;

            console.log("Token nhận được:", access_token);
            console.log("User info:", user_info);

            window.removeEventListener("message", handleMessage);
            resolve(access_token || null);
        });
    });
}


type AddCalendarProps = {
    data: { [key: string]: ScheduleItem };
};

export default function AddCalendar({ data }: AddCalendarProps) {
    const handleAddCalendar = async () => {
        try {
            const token = await openGoogleLogin();
            if (!token) {
                toast.error("Không lấy được token từ Google");
                return;
            }

            const classIds = Array.from(new Set(Object.values(data).map(item => item.classId)));
            const allScheduleItems: ScheduleJson[] = [];
            console.log("classIds: ", classIds)

            classIds.forEach((classId, index) => {
                const schedules = get_info_class(classId, index);
                if (schedules) {
                    allScheduleItems.push(...schedules);
                }
                console.log("Index:", index, "ClassID:", classId);
            });


            const calendarId = await createNewCalendar(token, 'TKB_SGU');
            toast.success("Đã tạo lịch thành công!");

            for (const item of allScheduleItems) {
                try {
                    const event = parseScheduleToEvent(item);
                    await addEventToCalendar(token, calendarId, event);
                    console.log(`✔️ Đã thêm: ${item.ten_mon} - ${item.nhom_to}`);
                } catch (err) {
                    console.error(`❌ Lỗi khi thêm sự kiện cho môn ${item.ten_mon}:`, err);
                    toast.error(`Lỗi thêm môn ${item.ten_mon}`);
                }
            }

            toast.success("Đã thêm toàn bộ thời khóa biểu vào Google Calendar!");
            await logout(token);
            toast.success("Đăng xuất thành công sau khi thêm lịch!");

        } catch (err) {
            console.error("Lỗi thêm lịch:", err);
            toast.error("Đã xảy ra lỗi trong quá trình xử lý.");
        }
    };

    return (
        <Button onClick={handleAddCalendar} variant="outline" className="gap-2" title="Thêm vào Google Calendar">
            <CalendarPlus className="w-4 h-4" />
            {/* Thêm vào Google Calendar */}
        </Button>
    );
}
