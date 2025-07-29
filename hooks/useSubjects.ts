"use client"

import { useState, useEffect } from "react";
import { ClassInfo, Subject, ScheduleItem } from "@/components/types";

const STORAGE_KEY = "selectedSubjects";

export function useSubjects() {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [loaded, setLoaded] = useState(false); // ✅ để tránh ghi đè sau khi load

  // Load từ localStorage khi khởi động
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSelectedSubjects(parsed);
    }
    setLoaded(true); // ✅ đánh dấu đã load xong
  }, []);

  // Mỗi lần thay đổi, lưu vào localStorage — nhưng chỉ khi đã load xong
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSubjects));
      console.log("Saved to localStorage:", selectedSubjects);
    }
  }, [selectedSubjects, loaded]);

  const addSubject = (subject: Subject) => {
    if (!selectedSubjects.find((s) => s.id === subject.id)) {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const removeSubject = (ma_mon: string) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== ma_mon));
  };

  const clearAll = () => {
    setSelectedSubjects([]);
  };

  return {
    selectedSubjects,
    addSubject,
    removeSubject,
    clearAll,
  };
}
