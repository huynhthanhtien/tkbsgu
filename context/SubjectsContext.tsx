"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { Subject } from "@/components/types";

const STORAGE_KEY = "selectedSubjects";

type SubjectContextType = {
  selectedSubjects: Subject[];
  addSubject: (subject: Subject) => void;
  removeSubject: (ma_mon: string) => void;
  clearAll: () => void;
};

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export const SubjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedSubjects(JSON.parse(stored));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSubjects));
    }
  }, [selectedSubjects, loaded]);

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
      value={{ selectedSubjects, addSubject, removeSubject, clearAll }}
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
