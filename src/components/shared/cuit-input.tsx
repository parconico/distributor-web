"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { validateCuit, formatCuit } from "@/lib/cuit-validator";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CuitInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CuitInput({ value, onChange, error, disabled }: CuitInputProps) {
  const cleaned = value.replace(/\D/g, "");
  const isComplete = cleaned.length === 11;
  const isValid = isComplete && validateCuit(cleaned);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
      onChange(formatCuit(raw));
    },
    [onChange]
  );

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleChange}
        placeholder="XX-XXXXXXXX-X"
        maxLength={13}
        disabled={disabled}
        className={cn(
          "pr-10",
          error && "border-destructive",
          isComplete && isValid && "border-green-500",
          isComplete && !isValid && "border-destructive"
        )}
      />
      {isComplete && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {isComplete && !isValid && !error && (
        <p className="mt-1 text-sm text-destructive">CUIT inválido</p>
      )}
    </div>
  );
}
