"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Type, Hash, Image as ImageIcon, Calendar, ToggleLeft, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomFieldsPanelProps {
  form: any;
}

const FIELD_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "textarea", label: "Long Text", icon: Type },
  { value: "number", label: "Number", icon: Hash },
  { value: "boolean", label: "True/False", icon: ToggleLeft },
  { value: "date", label: "Date", icon: Calendar },
  { value: "select", label: "Dropdown", icon: Settings },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "url", label: "URL", icon: Type },
];

export function CustomFieldsPanel({ form }: CustomFieldsPanelProps) {
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    key: "",
    label: "",
    type: "text",
    required: false,
    options: "",
    defaultValue: "",
  });

  const customFields = form.watch("customFields") || {};

  const addField = () => {
    if (!newField.key || !newField.label) return;
    const fields = { ...customFields };
    fields[newField.key] = {
      label: newField.label,
      type: newField.type,
      required: newField.required,
      options: newField.options ? newField.options.split(",").map(o => o.trim()) : [],
      defaultValue: newField.defaultValue,
      value: newField.defaultValue,
    };
    form.setValue("customFields", fields);
    setNewField({ key: "", label: "", type: "text", required: false, options: "", defaultValue: "" });
    setShowAddField(false);
  };

  const removeField = (key: string) => {
    const fields = { ...customFields };
    delete fields[key];
    form.setValue("customFields", fields);
  };

  const updateFieldValue = (key: string, value: any) => {
    const fields = { ...customFields };
    if (fields[key]) {
      fields[key].value = value;
      form.setValue("customFields", fields);
    }
  };

  const renderFieldInput = (key: string, field: any) => {
    const value = field.value || field.defaultValue || "";
    
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFieldValue(key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="h-20"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case "boolean":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === "true"}
              onChange={(e) => updateFieldValue(key, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Yes</span>
          </label>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(key, e.target.value)}
          />
        );
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(v) => updateFieldValue(key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "image":
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={value}
              onChange={(e) => updateFieldValue(key, e.target.value)}
              placeholder="Image URL"
            />
            {value && (
              <img src={value} alt={field.label} className="max-h-32 rounded" />
            )}
          </div>
        );
      case "url":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => updateFieldValue(key, e.target.value)}
            placeholder="https://example.com"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateFieldValue(key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Fields
          </CardTitle>
          <CardDescription>Add custom metadata fields for this article</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddField(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(customFields).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No custom fields added yet</p>
            <Button variant="outline" className="mt-2" onClick={() => setShowAddField(true)}>
              Add your first custom field
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(customFields).map(([key, field]: [string, any]) => (
              <div key={key} className="border rounded-lg p-4 flex items-start gap-4">
                <GripVertical className="h-6 w-6 text-muted-foreground mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline" className="text-xs">{field.type}</Badge>
                      {field.required && <Badge variant="default" className="text-xs">Required</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeField(key)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  {renderFieldInput(key, field)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Field Dialog */}
        <Dialog open={showAddField} onOpenChange={setShowAddField}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Field</DialogTitle>
              <DialogDescription>Define a new custom metadata field</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Key *</Label>
                  <Input
                    placeholder="e.g., author_bio, related_posts"
                    value={newField.key}
                    onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier (snake_case)</p>
                </div>
                <div className="space-y-2">
                  <Label>Display Label *</Label>
                  <Input
                    placeholder="e.g., Author Biography"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Field Type *</Label>
                <Select
                  value={newField.type}
                  onValueChange={(v) => setNewField({ ...newField, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <type.icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {["select"].includes(newField.type) && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    placeholder="Option 1, Option 2, Option 3"
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Default Value</Label>
                <Input
                  placeholder="Optional default value"
                  value={newField.defaultValue}
                  onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="required">Required field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
              <Button onClick={addField} disabled={!newField.key || !newField.label}>
                Add Field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default CustomFieldsPanel;
