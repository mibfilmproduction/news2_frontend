"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag, Hash, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface TagManagerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagManager({ value, onChange, placeholder = "Add tags..." }: TagManagerProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (inputValue.length >= 2) {
      fetchSuggestions(inputValue);
    } else {
      setSuggestions([]);
    }
  }, [inputValue]);

  const fetchSuggestions = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/news/tags/popular?search=${encodeURIComponent(query)}&limit=10`);
      if (response.success && response.data) {
        setSuggestions(response.data.filter((tag: string) => !value.includes(tag)));
      }
    } catch (error) {
      console.error("Error fetching tag suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleFocus = () => {
    if (inputValue.length >= 2) setShowSuggestions(true);
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-primary/20">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            <Hash className="h-3 w-3" />
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter(t => t !== tag))}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={value.length > 0 ? "" : placeholder}
          className="flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-sm"
          style={{ minWidth: "120px" }}
        />
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full max-h-40 overflow-y-auto border rounded-lg bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              onClick={() => addTag(suggestion)}
            >
              <Hash className="h-3 w-3 text-muted-foreground" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add tags. Start typing for suggestions.
        </p>
      )}
    </div>
  );
}

export default TagManager;