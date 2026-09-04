"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, Clock, Save, Eye, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishPanelProps {
  onPublish: () => void;
  onSchedule: (date: string) => void;
  onSaveDraft: () => void;
  isSaving: boolean;
  currentStatus: string;
  scheduledAt: string;
  onPreview?: () => void;
}

export function PublishPanel({ onPublish, onSchedule, onSaveDraft, isSaving, currentStatus, scheduledAt, onPreview }: PublishPanelProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(scheduledAt || new Date(Date.now() + 3600000).toISOString().slice(0, 16));

  const handleScheduleClick = () => {
    setShowSchedule(true);
  };

  const handleScheduleConfirm = () => {
    if (!scheduleDate || new Date(scheduleDate).getTime() <= Date.now()) return;
    onSchedule(scheduleDate);
    setShowSchedule(false);
  };

  const handleSaveDraft = () => {
    onSaveDraft();
  };

  const handlePublishClick = () => {
    if (currentStatus === "scheduled") {
      if (confirm("This will publish the article immediately. Continue?")) {
        onPublish();
      }
    } else {
      onPublish();
    }
  };

  return (
    <Card className="border-primary shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5 text-primary" />
          Publish
        </CardTitle>
        <CardDescription>Control when and how your article goes live</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              currentStatus === "published" && "bg-green-100 text-green-700",
              currentStatus === "draft" && "bg-gray-100 text-gray-700",
              currentStatus === "scheduled" && "bg-blue-100 text-blue-700",
              currentStatus === "pending_review" && "bg-purple-100 text-purple-700"
            )}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-3">
          <Label className="font-medium">Visibility</Label>
          <Select
            value={currentStatus === "scheduled" ? "scheduled" : currentStatus === "published" ? "public" : "private"}
            onValueChange={(value) => {
              // Changing this selector must not accidentally publish or save.
              if (value === "scheduled") handleScheduleClick();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public - Visible to everyone</SelectItem>
              <SelectItem value="private">Private - Only visible to editors</SelectItem>
              <SelectItem value="scheduled">Scheduled - Publish at a specific time</SelectItem>
              <SelectItem value="pending_review">Pending Review - Needs approval</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schedule Section */}
        {showSchedule && (
          <div className="space-y-3 p-4 rounded-lg bg-blue-50 border border-blue-200 animate-in">
            <Label className="font-medium">Schedule for later</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {scheduleDate ? new Date(scheduleDate).toLocaleString() : "Select date & time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" sideOffset={5}>
                <div className="p-2">
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="rounded-md border p-2"
                  />
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSchedule(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleScheduleConfirm}>
                Schedule
              </Button>
              {scheduleDate && new Date(scheduleDate).getTime() <= Date.now() && (
                <p className="text-xs text-red-600">Choose a future date and time.</p>
              )}
            </div>
          </div>
        )}

        {!showSchedule && currentStatus !== "scheduled" && (
          <Button variant="outline" className="w-full" onClick={handleScheduleClick}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule for later
          </Button>
        )}

        <Separator />

        {/* Publish Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          <Button
            variant="default"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handlePublishClick}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {currentStatus === "published" ? "Update" : "Publish"}
          </Button>
        </div>

        {onPreview && (
          <Button variant="ghost" className="w-full" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last saved: Just now</span>
          <span>Auto-save: Enabled</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default PublishPanel;
