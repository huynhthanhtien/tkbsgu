"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { Subject } from "@/components/types";
import { useTkb } from "@/context/TkbContext";
import { ScheduleItem } from "@/components/types"

const STORAGE_KEY = "selectedSubjects";

type SubjectContextType = {
  selectedSubjects: Subject[];
  addSubject: (subject: Subject) => void;
  removeSubject: (ma_mon: string) => void;
  clearAll: () => void;
  schedule: { [key: string]: ScheduleItem };
  setSchedule: React.Dispatch<React.SetStateAction<{ [key: string]: ScheduleItem }>>
  // setSelectedSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  // setSelectedSubjects: (Subject: Subject[]) => void;
};

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export const SubjectProvider = ({ children }: { children: React.ReactNode }) => {
  const { selectedTkb, setSelectedTkb } = useTkb();
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<{ [key: string]: ScheduleItem }>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // const stored = localStorage.getItem(STORAGE_KEY);
    // if (!tkb) return;
    // if (stored) {
    //   setSelectedSubjects(JSON.parse(stored));
    // }
    if (selectedTkb) {
      setSelectedSubjects(selectedTkb.data.Sub);
      setSchedule(selectedTkb.data.ScheduleItem);
    } else return;
    setLoaded(true);
  }, [selectedTkb]);

  useEffect(() => {
    if (loaded) {
      // localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSubjects));
      if (selectedTkb) {
        // console.log("update", selectedTkb)
        setSelectedTkb({
          id: selectedTkb.id,
          name: selectedTkb.name,
          createdAt: selectedTkb.createdAt,
          data: {
            Sub: selectedSubjects,
            ScheduleItem: schedule,
          }
        })
      }
    }
  }, [selectedSubjects, loaded, schedule]);

  const addSubject = (subject: Subject) => {
    setSelectedSubjects((prev) =>
      prev.some((s) => s.id === subject.id) ? prev : [...prev, subject]
    );
  };

  const removeSubject = (ma_mon: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.id !== ma_mon));
  };

  const clearAll = () => {
    setSelectedSubjects([]);
  };

  return (
    <SubjectContext.Provider
      value={{ selectedSubjects, addSubject, removeSubject, clearAll, schedule, setSchedule }}
    >
      {children}
    </SubjectContext.Provider>
  );
};

export const useSubjects = () => {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error("useSubjects must be used within a SubjectProvider");
  }
  return context;
};
