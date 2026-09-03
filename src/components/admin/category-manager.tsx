"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, FolderOpen, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: Category | string;
  children?: Category[];
  displayOrder?: number;
  isActive?: boolean;
}

interface CategoryManagerProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onCreateCategory?: (category: Partial<Category>) => void;
}

export function CategoryManager({ categories, selectedCategory, onSelectCategory, onCreateCategory }: CategoryManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    displayOrder: 0,
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const buildTree = (cats: Category[], parentId: string | null = null): Category[] => {
    return cats
      .filter(c => (c.parent === parentId || (!c.parent && !parentId)) && c.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  };

  const renderCategoryTree = (cats: Category[], level: number = 0) => {
    return cats.map(cat => {
      const hasChildren = categories.some(c => c.parent === cat._id);
      const isSelected = cat._id === selectedCategory;
      const children = hasChildren ? categories.filter(c => c.parent === cat._id) : [];

      return (
        <div key={cat._id} className={cn("transition-colors", isSelected && "bg-primary/5")}>
          <div className={cn("flex items-center gap-2 py-1 px-2 rounded", level > 0 && "ml-6")}>
            <span className={cn("flex-1 truncate font-medium", isSelected && "text-primary")}>
              {cat.name}
            </span>
            {isSelected && <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onSelectCategory(cat._id)}
              >
                <FolderOpen className="h-3 w-3" />
              </Button>
              {onCreateCategory && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditingCategory(cat)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditingCategory(cat)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {children.length > 0 && (
            <div className="border-l-2 border-gray-200 pl-2">
              {renderCategoryTree(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleCreate = () => {
    if (!newCategory.name) return;
    if (onCreateCategory) {
      onCreateCategory(newCategory);
    }
    setNewCategory({ name: "", slug: "", description: "", parent: "", displayOrder: 0 });
    setShowCreate(false);
  };

  const rootCategories = buildTree(categories);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Categories</Label>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
        {rootCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No categories found</p>
          </div>
        ) : (
          renderCategoryTree(rootCategories)
        )}
      </div>

      {/* Create/Edit Category Dialog */}
      <Dialog open={showCreate || !!editingCategory} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingCategory(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>{editingCategory ? "Modify category details" : "Create a new category for organizing articles"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Category name"
                value={editingCategory ? editingCategory.name : newCategory.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (editingCategory) setEditingCategory({ ...editingCategory, name: value });
                  else setNewCategory({ ...newCategory, name: value, slug: value.toLowerCase().replace(/\s+/g, "-") });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                placeholder="auto-generated from name"
                value={editingCategory ? editingCategory.slug : newCategory.slug}
                onChange={(e) => {
                  if (editingCategory) setEditingCategory({ ...editingCategory, slug: e.target.value });
                  else setNewCategory({ ...newCategory, slug: e.target.value });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Category description"
                value={editingCategory ? editingCategory.description : newCategory.description}
                onChange={(e) => {
                  if (editingCategory) setEditingCategory({ ...editingCategory, description: e.target.value });
                  else setNewCategory({ ...newCategory, description: e.target.value });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={(editingCategory ? editingCategory.parent : newCategory.parent) as string | undefined}
                onValueChange={(value) => {
                  if (editingCategory) setEditingCategory({ ...editingCategory, parent: value });
                  else setNewCategory({ ...newCategory, parent: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent (top level)</SelectItem>
                  {categories
                    .filter(c => c._id !== (editingCategory?._id || ""))
                    .map(cat => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={editingCategory ? editingCategory.displayOrder : newCategory.displayOrder}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 0;
                  if (editingCategory) setEditingCategory({ ...editingCategory, displayOrder: value });
                  else setNewCategory({ ...newCategory, displayOrder: value });
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingCategory(null); }}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? () => {} : handleCreate}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CategoryManager;
