"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useIndexedDB } from "@/context/IndexedDBContext"
import { Tkb } from "@/components/types";
import merge from "lodash.merge";

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface TkbContextType {
    selectedTkb: Tkb | null;
    setSelectedTkb: (tkb: Tkb) => void;
    // ready: boolean;
    // updateSelectedTkb: (updates: Tkb) => void;
}

const TkbContext = createContext<TkbContextType | undefined>(undefined);

export const TkbProvider = ({ id, children }: { id: number; children: ReactNode }) => {
// export const TkbProvider = ({ children }: { children: ReactNode }) => {
    const [selectedTkb, setSelectedTkb] = useState<Tkb | null>(null);
    const { updateTkb, getTkbById, ready } = useIndexedDB();
    // const [ready , setReady] = useState(false);

    useEffect(() =>{
        const fetch = async () => {
            console.log(id);
            const data = await getTkbById(id);
            console.log("data", data);
            if (data){
                setSelectedTkb(data);
            }
        }
        if (!ready) return;
        fetch();
        // setReady(true);
    }, [id, ready])

    useEffect(() => {
        const updateData = async () => {
            if (selectedTkb) {
                await updateTkb(selectedTkb?.id, selectedTkb)
            }
        }
        if (ready){
            updateData();
        }
    }, [selectedTkb])

    useEffect(() => {
        console.log("selected tkb ", selectedTkb);
    }, [selectedTkb]);


    // const updateSelectedTkb = (updates: Tkb) => {
    //     console.log("tkb update", updates);
    //     setSelectedTkb(updates);
    // };


    return (
        <TkbContext.Provider value={{ selectedTkb, setSelectedTkb }}>
            {children}
        </TkbContext.Provider>
    );
};

export const useTkb = () => {
    const context = useContext(TkbContext);
    if (!context) {
        throw new Error("useTkb must be used within a TkbProvider");
    }
    return context;
};
