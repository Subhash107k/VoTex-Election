import React from "react";
import { Info } from "lucide-react";

export default function InstructionPanel({
  instruction,
}: {
  instruction: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
        <Info className="h-3.5 w-3.5" />
        Instruction
      </div>
      <p className="text-sm font-bold">{instruction}</p>
    </div>
  );
}
