"use client";

import React, { useState } from "react";
import { ClassInfo, Subject } from "@/components/types";
import rawData from "@/public/data.json";
import { useTheme } from "next-themes";
import { useSubjects } from "@/context/SubjectsContext";



function SubjectSelector() {
  const [searchText, setSearchText] = useState("");
  const { theme } = useTheme();

  const { selectedSubjects, addSubject } = useSubjects();

  const handleAddSubject = (item: any) => {
    const subject = convertRawToSubject(item);
    addSubject(subject);
    console.log(subject);
    setSearchText("");
  };

  const filteredList =
    searchText.length >= 2
      ? rawData
        .filter((item: any) =>
          // search theo tên môn hoặc mã môn
          item.ten_mon.toLowerCase().includes(searchText.toLowerCase()) ||
          item.ma_mon.toLowerCase().includes(searchText.toLowerCase())
        )
        .slice(0, 20)
      : [];

  return (
    <div className="p-0 lg:p-4 max-w-3xl mx-auto relative">
      <div className="relative">
        <input
          type="search"
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Tìm kiếm môn học..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full min-h-12 lg:min-h-0 p-3 lg:p-2 text-base lg:text-sm border border-gray-300 dark:border-gray-600 rounded-xl lg:rounded mb-2 bg-white dark:bg-gray-800 dark:text-white"
        />

        {searchText.length >= 2 && filteredList.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow max-h-[50dvh] lg:max-h-64 overflow-y-auto rounded-xl lg:rounded">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredList.map((item: any) => (
                <li
                  key={`${item.ma_mon}-${item.nhom_to}`}
                  className="px-3 py-3.5 lg:p-2 text-sm hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-700 cursor-pointer"
                  onClick={() => handleAddSubject(item)}
                >
                  {item.ma_mon} - {item.ten_mon}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectSelector;



export function getSubjectById(id: string): Subject {
  const result = rawData.find((item: any) => item.ma_mon === id);
  if (!result) {
    throw new Error(`Subject with id ${id} not found`);
  }
  return convertRawToSubject(result);
}

const convertRawToSubject = (item: any): Subject => ({
  id: item.ma_mon,
  name: item.ten_mon,
  code: item.ma_mon,
  credit: Number(item.so_tc),
  classes: item.lop.map((lopItem: any): ClassInfo => {
    const scheduleSet = new Set<string>();
    const schedules = lopItem.tkb
      .map((tkbItem: any) => {
        const key = `${tkbItem.thu}-${tkbItem.tbd}-${tkbItem.tkt}-${tkbItem.phong}-${tkbItem.giang_vien}`;
        if (scheduleSet.has(key)) return null; // bỏ nếu đã có
        scheduleSet.add(key);
        return {
          teacher: tkbItem.giang_vien,
          day: tkbItem.thu,
          startPeriod: tkbItem.tbd,
          endPeriod: tkbItem.tkt,
          room: tkbItem.phong,
        };
      })
      .filter(Boolean); // bỏ các giá trị null

    return {
      id: `${item.ma_mon}-${lopItem.nhom_to}`,
      color: getRandomColorName(),
      schedules,
    };
  }),
});

function getRandomColorName(): string {
  const index = Math.floor(Math.random() * colorNames.length);
  return colorNames[index];
}

const colorNames = [
  "red", "orange", "green", "blue", "indigo",
  "purple", "pink", "teal"
];