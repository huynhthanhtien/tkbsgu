"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { SubjectProvider } from "@/context/SubjectsContext";
import { TkbProvider } from "@/context/TkbContext";

export default function TkbLayout({ children }: { children: ReactNode }) {
    const { id } = useParams(); // Lấy id từ URL /tkb/{id}
    
    if (!id) return null; // Trường hợp chưa có id
    
    const numericId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id, 10);

    if (isNaN(numericId)) {
        return <p>ID không hợp lệ</p>;
    }

    return (
        <TkbProvider id={numericId}> {/* Truyền id vào provider */}
            <SubjectProvider>
                {children}
            </SubjectProvider>
        </TkbProvider>
    );
}
