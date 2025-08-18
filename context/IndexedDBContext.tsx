"use client";

import merge from "lodash.merge";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Subject, ScheduleItem, Tkb } from "@/components/types";

const DB_NAME = "MyDatabase";
const STORE_NAME = "tkb";
const DB_VERSION = 1;

// ===== Kiểu dữ liệu =====

interface IndexedDBContextType {
    addTkb: (tkb: Tkb) => Promise<void>;
    getTkbList: () => Promise<Tkb[]>;
    updateTkb: (id: number, updates: Partial<Tkb>) => Promise<void>;
    getTkbById: (id: number) => Promise<Tkb | undefined>;
    ready: Boolean;
}

const IndexedDBContext = createContext<IndexedDBContextType | undefined>(
    undefined
);

// ===== Helper mở DB =====
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ===== Provider =====
export const IndexedDBProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [db, setDb] = useState<IDBDatabase | null>(null);

    const [ready, setReady] = useState(false);

    useEffect(() => {
        openDB()
            .then((db) => {
                setDb(db);
                setReady(true);
            })
            .catch(console.error);
    }, []);

    const addTkb = async (tkb: Tkb) => {
        if (!db) return;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.put(tkb);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    };

    const getTkbList = async (): Promise<Tkb[]> => {
        if (!db) return [];
        return new Promise<Tkb[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as Tkb[]);
            request.onerror = () => reject(request.error);
        });
    };

    const updateTkb = async (id: number, updates: Partial<Tkb>) => {
        if (!db) return;
        console.log("db update ", updates);
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const existing = getReq.result as Tkb | undefined;
                if (!existing) {
                    reject(new Error(`Không tìm thấy TKB có id=${id}`));
                    return;
                }

                // Deep merge mọi cấp
                // const updated = merge({}, existing, updates);

                const putReq = store.put(updates);

                putReq.onsuccess = () => resolve();
                putReq.onerror = () => reject(putReq.error);
            };

            getReq.onerror = () => reject(getReq.error);
            tx.onerror = () => reject(tx.error);
        });
    };

    const getTkbById = async (id: number): Promise<Tkb | undefined> => {
        if (!db) return undefined;

        return new Promise<Tkb | undefined>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result as Tkb | undefined);
            };

            request.onerror = () => reject(request.error);
        });
    };

    return (
        <IndexedDBContext.Provider value={{ addTkb, getTkbList, updateTkb, ready, getTkbById }}>
            {children}
        </IndexedDBContext.Provider>
    );
};

// ===== Hook =====
export const useIndexedDB = () => {
    const ctx = useContext(IndexedDBContext);
    if (!ctx)
        throw new Error("useIndexedDB must be used within IndexedDBProvider");
    return ctx;
};
