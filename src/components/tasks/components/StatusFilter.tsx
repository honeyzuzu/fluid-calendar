import { useState } from "react";

import { ChevronDown as HiChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { TaskStatus } from "@/types/task";

import { formatEnumValue } from "../utils/task-list-utils";

interface StatusFilterProps {
  value: TaskStatus[];
  onChange: (value: TaskStatus[]) => void;
}

export function StatusFilter({ value = [], onChange }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (status: TaskStatus) => {
    const index = value.indexOf(status);
    if (index === -1) {
      onChange([...value, status]);
    } else {
      onChange(value.filter((s) => s !== status));
    }
  };

  const handleSelectAll = () => {
    onChange(Object.values(TaskStatus));
    setIsOpen(false);
  };

  const handleSelectNone = () => {
    onChange([]);
    setIsOpen(false);
  };

  const allStatuses = Object.values(TaskStatus);
  const selectionNames = value.map(formatEnumValue);
  const isOpenSelection =
    value.length === 2 &&
    value.includes(TaskStatus.TODO) &&
    value.includes(TaskStatus.IN_PROGRESS);
  const summary =
    value.length === 0 || value.length === allStatuses.length
      ? "Status: All"
      : isOpenSelection
        ? "Status: Open (2)"
        : value.length === 1
          ? `Status: ${selectionNames[0]}`
          : `Status: ${value.length} selected`;
  const accessibleSelection =
    value.length === 0 || value.length === allStatuses.length
      ? "all statuses"
      : selectionNames.join(", ");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 min-w-[140px] justify-between px-3"
          aria-label={`Filter by status. Selected: ${accessibleSelection}`}
        >
          <span className="truncate">{summary}</span>
          <HiChevronDown
            aria-hidden="true"
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0 py-1">
        <div className="flex justify-between border-b border-border px-3 py-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs hover:bg-transparent hover:text-primary"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs hover:bg-transparent hover:text-primary"
            onClick={handleSelectNone}
          >
            Clear
          </Button>
        </div>
        {allStatuses.map((status) => (
          <label
            key={status}
            className="flex cursor-pointer items-center px-3 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={value.includes(status)}
              onCheckedChange={() => handleChange(status)}
              className="h-3 w-3"
            />
            <span className="ml-2 text-sm text-foreground">
              {formatEnumValue(status)}
            </span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}
