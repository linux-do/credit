"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchItems, type SearchItem } from "@/lib/utils/search-data";
import { Home, Settings, FileText, Shield } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons = {
  page: Home,
  feature: FileText,
  setting: Settings,
  admin: Shield,
};

const categoryLabels = {
  page: "页面",
  feature: "功能",
  setting: "设置",
  admin: "管理",
};

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    const items = searchItems(search);
    setResults(items);
  }, [search]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      onOpenChange(false);
      router.push(item.url);
      setSearch("");
    },
    [onOpenChange, router]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Group results by category
  const groupedResults = results.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SearchItem[]>
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="搜索页面和功能..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>未找到结果</CommandEmpty>
        {Object.entries(groupedResults).map(([category, items]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          return (
            <CommandGroup
              key={category}
              heading={categoryLabels[category as keyof typeof categoryLabels]}
            >
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
