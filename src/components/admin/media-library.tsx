"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Image as ImageIcon, Upload, Download, Trash2, Check, MoreHorizontal, Filter, Grid, List, RefreshCw, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { getImageUrl } from "@/lib/utils";

interface MediaItem {
  _id: string;
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  tags?: string[];
  createdAt: string;
  uploadedBy?: { _id: string; name: string };
}

interface MediaLibraryProps {
  onSelect: (url: any) => void;
  multiple?: boolean;
}

export function MediaLibrary({ onSelect, multiple = false }: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolder, setCurrentFolder] = useState("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (searchTerm) params.search = searchTerm;
      if (currentFolder) params.folder = currentFolder;
      
      const response = await api.get("/media", params);
      if (response.success && response.data) {
        setMedia(response.data);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentFolder]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (currentFolder) formData.append("folder", currentFolder);
        
        const response = await api.upload("/media/upload", formData);
        if (response.success) {
          fetchMedia();
        }
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      setSelectedMedia(prev => {
        const next = new Set(prev);
        if (next.has(item._id)) next.delete(item._id);
        else next.add(item._id);
        return next;
      });
    } else {
      onSelect(item.url);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media file?")) return;
    try {
      await api.delete(`/media/${id}`);
      fetchMedia();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleBulkSelect = () => {
    onSelect(Array.from(selectedMedia).map(id => media.find(m => m._id === id)!.url));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b">
        <div className="flex items-center gap-3">
          <Label className="font-medium">Media Library</Label>
          <Badge variant="outline">{media.length} items</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchMedia}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <label className="cursor-pointer">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {multiple && selectedMedia.size > 0 && (
            <Button variant="default" onClick={handleBulkSelect}>
              <Check className="h-4 w-4 mr-2" />
              Select {selectedMedia.size}
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="p-3 border-b bg-blue-50">
          <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
            <span>Uploading {Object.keys(uploadProgress).length} file(s)...</span>
          </div>
          <div className="space-y-1">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs">{Math.round(progress)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">No media found</p>
            <p className="text-sm">Upload your first image or video</p>
            <label className="mt-4 cursor-pointer">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3">
              {media.map((item) => (
                <div
                  key={item._id}
                  className={cn(
                    "relative group cursor-pointer rounded-lg overflow-hidden border transition-all",
                    selectedMedia.has(item._id) && "ring-2 ring-primary border-primary"
                  )}
                  onClick={() => handleSelect(item)}
                >
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {item.mimeType.startsWith("video/") ? (
                      <video
                        src={getImageUrl(item.url)}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={getImageUrl(item.url)}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {selectedMedia.has(item._id) && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <Check className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)} • {item.mimeType.startsWith("video/") ? "Video" : "Image"}
                    </p>
                  </div>
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="p-3 w-10"></th>
                    <th className="p-3">File</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Dimensions</th>
                    <th className="p-3">Folder</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {media.map((item) => (
                    <tr
                      key={item._id}
                      className={cn(
                        "border-b hover:bg-gray-50",
                        selectedMedia.has(item._id) && "bg-primary/5"
                      )}
                      onClick={() => handleSelect(item)}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedMedia.has(item._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.mimeType.startsWith("video/") ? (
                              <video src={getImageUrl(item.url)} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={getImageUrl(item.url)} alt={item.originalName} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-xs">{item.originalName}</p>
                            <p className="text-xs text-muted-foreground">{item.mimeType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{item.mimeType.startsWith("video/") ? "Video" : "Image"}</Badge>
                      </td>
                      <td className="p-3 text-sm">{formatFileSize(item.size)}</td>
                      <td className="p-3 text-sm">
                        {item.width && item.height ? `${item.width}×${item.height}` : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{item.folder || "—"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default MediaLibrary;
