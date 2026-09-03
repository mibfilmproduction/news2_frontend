"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, RotateCcw, Eye, Loader2, Diff, FileText } from "lucide-react";
import { api } from "@/lib/api-client";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RevisionsPanelProps {
  article: any;
}

export function RevisionsPanel({ article }: RevisionsPanelProps) {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState<string | null>(null);

  const fetchRevisions = async () => {
    if (!article?._id) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/news/${article._id}/revisions`);
      if (response.success && response.data) {
        setRevisions(response.data);
      }
    } catch (error) {
      console.error("Error fetching revisions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRevisions();
  }, [article?._id]);

  const handleRestore = async (revisionId: string) => {
    if (!confirm("Are you sure you want to restore this revision? Current content will be saved as a new revision.")) return;
    try {
      const response = await api.post(`/news/${article._id}/revisions/${revisionId}/restore`);
      if (response.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error restoring revision:", error);
    }
  };

  const handleCompare = (revisionId: string) => {
    if (compareWith === revisionId) {
      setCompareWith(null);
      setCompareMode(false);
    } else if (compareWith) {
      setCompareMode(true);
    } else {
      setCompareWith(revisionId);
    }
  };

  const getCurrentRevision = () => {
    if (!compareMode || !compareWith) return article;
    return revisions.find(r => r._id === compareWith);
  };

  const current = getCurrentRevision();
  const latest = revisions[0];

  if (!article?._id) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Save the article first to see revision history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Revision History
          </CardTitle>
          <CardDescription>View and restore previous versions of this article</CardDescription>
        </div>
        {compareMode && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Diff className="h-3 w-3" />
            Comparing: {compareWith ? "Selected" : "Current"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : revisions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No revisions yet</p>
            <p className="text-sm">Revisions are created automatically on each save</p>
          </div>
        ) : (
          <div className="space-y-3">
            {revisions.map((revision, index) => {
              const isCurrent = index === 0;
              const isSelected = compareWith === revision._id;
              const isCompareBase = compareMode && !compareWith && isCurrent;
              
              return (
                <div
                  key={revision._id}
                  className={cn(
                    "border rounded-lg p-4 flex items-center justify-between transition-colors",
                    isSelected && "border-primary bg-primary/5",
                    isCompareBase && "border-blue-300 bg-blue-50"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                      isCurrent && "bg-green-100 text-green-700",
                      isSelected && "bg-primary/10 text-primary",
                      isCompareBase && "bg-blue-100 text-blue-700",
                      !isCurrent && !isSelected && !isCompareBase && "bg-gray-100 text-gray-500"
                    )}>
                      {isCurrent ? "✓" : revision._id.slice(-4)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {revision.title || "Untitled"}
                        </span>
                        {isCurrent && (
                          <Badge className="bg-green-100 text-green-700">Current</Badge>
                        )}
                        {isSelected && (
                          <Badge className="bg-primary/10 text-primary">Comparing</Badge>
                        )}
                        {isCompareBase && (
                          <Badge className="bg-blue-100 text-blue-700">Base</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(revision.createdAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {revision.content?.length || 0} chars
                        </span>
                        {revision.createdBy && (
                          <span className="flex items-center gap-1">
                            <span>{revision.createdBy.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRevision(revision)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {compareMode ? (
                      <>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="icon"
                          onClick={() => handleCompare(revision._id)}
                        >
                          <Diff className="h-4 w-4" />
                        </Button>
                        {isSelected && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setCompareWith(null);
                              setCompareMode(false);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setCompareWith(revision._id);
                            setCompareMode(true);
                          }}
                        >
                          <Diff className="h-4 w-4" />
                        </Button>
                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(revision._id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Revision Comparison Dialog */}
        <Dialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Revision Preview</DialogTitle>
              <DialogDescription>
                {selectedRevision?.title} - {new Date(selectedRevision?.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <DialogContent className="max-h-[60vh]">
              <ScrollArea className="h-[60vh]">
                <div className="prose prose-lg max-w-none p-4">
                  <div dangerouslySetInnerHTML={{ __html: selectedRevision?.content || "" }} />
                </div>
              </ScrollArea>
            </DialogContent>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRevision(null)}>Close</Button>
              {!selectedRevision?._id.includes("current") && (
                <Button onClick={() => handleRestore(selectedRevision._id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This Version
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default RevisionsPanel;