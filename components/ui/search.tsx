"use client";

import React, { useState } from "react";
import { ClassInfo, Subject } from "@/components/types";
import rawData from "@/public/data.json";
import { useTheme } from "next-themes";
import { it } from "node:test";
import { useSubjects } from "@/context/SubjectsContext";

function SubjectSelector() {
  const [searchText, setSearchText] = useState("");
  const { theme } = useTheme();

  const { selectedSubjects, addSubject } = useSubjects();


  const convertRawToSubject = (item: any): Subject => ({
    id: item.ma_mon,
    name: item.ten_mon,
    code: item.ma_mon,
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

  const colorNames = [
    "red", "orange", "green", "blue", "indigo",
    "purple", "pink", "teal"
  ];

  function getRandomColorName(): string {
    const index = Math.floor(Math.random() * colorNames.length);
    return colorNames[index];
  }

  const handleAddSubject = (item: any) => {
    const subject = convertRawToSubject(item);
    addSubject(subject);
    console.log(subject);
    setSearchText(""); // Clear input
  };

  const filteredList =
    searchText.length >= 2
      ? rawData
        .filter((item: any) =>
          item.ten_mon.toLowerCase().includes(searchText.toLowerCase())
        )
        .slice(0, 20)
      : [];

  return (
    <div className="p-4 max-w-3xl mx-auto relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm môn học..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-800 dark:text-white"
        />

        {searchText.length >= 2 && filteredList.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow max-h-64 overflow-y-auto">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredList.map((item: any) => (
                <li
                  key={`${item.ma_mon}-${item.nhom_to}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleAddSubject(item)}
                >
                  {item.ten_mon} ({item.ma_mon})
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
