import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { MediaLibrary } from "@/components/admin/media-library";
import { CategoryManager } from "@/components/admin/category-manager";
import { TagManager } from "@/components/admin/tag-manager";
import { SEOPanel } from "@/components/admin/seo-panel";
import { PublishPanel } from "@/components/admin/publish-panel";
import { CustomFieldsPanel } from "@/components/admin/custom-fields-panel";
import { RevisionsPanel } from "@/components/admin/revisions-panel";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Eye, Calendar, Clock, Tag, Image as ImageIcon, AlertTriangle, ChevronLeft, ChevronRight, LayoutDashboard, FileText, Settings, History, Image, Globe, Bell, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

const articleFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  content: z.string().min(20, "Content must be at least 20 characters."),
  summary: z.string().min(10, "Summary must be at least 10 characters."),
  category: z.string({ required_error: "Please select a category." }),
  tags: z.array(z.string()).optional(),
  articleLanguage: z.enum(["hindi", "english"], { required_error: "Please select a language." }),
  slug: z.string().optional(),
  status: z.enum(["published", "draft", "scheduled", "pending_review"], { required_error: "Please select a status." }),
  scheduledAt: z.string().optional(),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  metaTitle: z.string().max(70, "Meta title cannot exceed 70 characters.").optional(),
  metaDescription: z.string().max(160, "Meta description cannot exceed 160 characters.").optional(),
  focusKeyword: z.string().optional(),
  canonicalUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
  schemaType: z.enum(["Article", "NewsArticle", "BlogPosting"]).optional(),
  customFields: z.record(z.any()).optional(),
});

type ArticleFormData = z.infer<typeof articleFormSchema>;

type Article = {
  _id: string;
  title: string;
  content: string;
  summary: string;
  slug: string;
  image: string;
  imagePublicId?: string;
  category: { _id: string; name: string; slug: string };
  author: { _id: string; name: string; avatar?: string };
  tags: string[];
  articleLanguage: "hindi" | "english";
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: string;
  schemaType?: string;
  readingTime?: number;
  isBreaking: boolean;
  isFeatured: boolean;
  allowComments: boolean;
  status: "published" | "draft" | "scheduled" | "pending_review";
  scheduledAt?: string;
  publishedAt?: string;
  viewCount: number;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  revisions?: ArticleRevision[];
};

type ArticleRevision = {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: { _id: string; name: string };
};

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  parent?: Category | string;
};

const initialFormValues: ArticleFormData = {
  title: "",
  content: "",
  summary: "",
  category: "",
  tags: [],
  articleLanguage: "hindi",
  slug: "",
  status: "draft",
  scheduledAt: "",
  isBreaking: false,
  isFeatured: false,
  allowComments: true,
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
  schemaType: "NewsArticle",
  customFields: {},
};

export function ArticleEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const isEditing = !!articleId;
  const { toast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [autosaveTimer, setAutosaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  const fetchArticle = useCallback(async () => {
    if (!articleId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/news/${articleId}`);
      if (response.success && response.data) {
        const articleData = response.data;
        setArticle(articleData);
        setPreviewImage(articleData.image ? getImageUrl(articleData.image) : "");
        form.reset({
          title: articleData.title,
          content: articleData.content,
          summary: articleData.summary,
          category: articleData.category?._id || "",
          tags: articleData.tags || [],
          articleLanguage: articleData.articleLanguage || "hindi",
          slug: articleData.slug || "",
          status: articleData.status,
          scheduledAt: articleData.scheduledAt ? new Date(articleData.scheduledAt).toISOString().slice(0, 16) : "",
          isBreaking: articleData.isBreaking,
          isFeatured: articleData.isFeatured,
          allowComments: articleData.allowComments,
          metaTitle: articleData.metaTitle || "",
          metaDescription: articleData.metaDescription || "",
          focusKeyword: articleData.focusKeyword || "",
          canonicalUrl: articleData.canonicalUrl || "",
          ogTitle: articleData.ogTitle || "",
          ogDescription: articleData.ogDescription || "",
          ogImage: articleData.ogImage || "",
          twitterCard: articleData.twitterCard || "summary_large_image",
          schemaType: articleData.schemaType || "NewsArticle",
          customFields: articleData.customFields || {},
        });
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast({ title: "Error", description: "Failed to load article", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [articleId, form, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories?active=true&format=simple");
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchArticle();
    }
  }, [fetchCategories, fetchArticle, isEditing]);

  useEffect(() => {
    const content = form.watch("content");
    const words = content ? content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
    setReadingTime(Math.max(1, Math.ceil(words / 200)));
  }, [form.watch("content")]);

  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
    setSelectedMediaUrl("");
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else if (article?.image) {
      setPreviewImage(getImageUrl(article.image));
    } else {
      setPreviewImage("");
    }
  };

  const handleMediaSelect = (mediaUrl: string) => {
    setPreviewImage(mediaUrl);
    setSelectedImage(null);
    setSelectedMediaUrl(mediaUrl);
    setShowMediaLibrary(false);
  };

  const calculateReadingTime = (content: string) => {
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const autosave = useCallback(async () => {
    if (!form.formState.isDirty) return;
    try {
      const formData = new FormData();
      const values = form.getValues();
      
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("summary", values.summary);
      formData.append("category", values.category);
      formData.append("articleLanguage", values.articleLanguage);
      formData.append("status", "draft");
      formData.append("isBreaking", String(values.isBreaking));
      formData.append("isFeatured", String(values.isFeatured));
      formData.append("allowComments", String(values.allowComments));
      
      if (values.tags?.length) formData.append("tags", JSON.stringify(values.tags));
      if (values.slug) formData.append("slug", values.slug);
      if (values.metaTitle) formData.append("metaTitle", values.metaTitle);
      if (values.metaDescription) formData.append("metaDescription", values.metaDescription);
      if (values.focusKeyword) formData.append("focusKeyword", values.focusKeyword);
      if (values.canonicalUrl) formData.append("canonicalUrl", values.canonicalUrl);
      if (values.ogTitle) formData.append("ogTitle", values.ogTitle);
      if (values.ogDescription) formData.append("ogDescription", values.ogDescription);
      if (values.ogImage) formData.append("ogImage", values.ogImage);
      if (values.twitterCard) formData.append("twitterCard", values.twitterCard);
      if (values.schemaType) formData.append("schemaType", values.schemaType);
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (selectedMediaUrl) {
        formData.append("imageUrl", selectedMediaUrl);
      }
      
      if (articleId) {
        await api.updateWithUpload(`/news/${articleId}`, formData);
      } else {
        await api.upload("/news", formData);
      }
      setLastSaved(new Date());
      toast({ title: "Auto-saved", description: "Draft saved automatically" });
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  }, [form, articleId, selectedImage, selectedMediaUrl, toast]);

  useEffect(() => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    setAutosaveTimer(setTimeout(autosave, 30000));
    return () => { if (autosaveTimer) clearTimeout(autosaveTimer); };
  }, [form.watch(), autosave]);

  const onSubmit = async (values: ArticleFormData, publishAction: "save" | "publish" | "schedule" = "save") => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("summary", values.summary);
      formData.append("category", values.category);
      formData.append("articleLanguage", values.articleLanguage);
      formData.append("isBreaking", String(values.isBreaking));
      formData.append("isFeatured", String(values.isFeatured));
      formData.append("allowComments", String(values.allowComments));
      
      if (values.tags?.length) formData.append("tags", JSON.stringify(values.tags));
      if (values.slug?.trim()) formData.append("slug", values.slug.trim());
      if (values.metaTitle?.trim()) formData.append("metaTitle", values.metaTitle.trim());
      if (values.metaDescription?.trim()) formData.append("metaDescription", values.metaDescription.trim());
      if (values.focusKeyword?.trim()) formData.append("focusKeyword", values.focusKeyword.trim());
      if (values.canonicalUrl?.trim()) formData.append("canonicalUrl", values.canonicalUrl.trim());
      if (values.ogTitle?.trim()) formData.append("ogTitle", values.ogTitle.trim());
      if (values.ogDescription?.trim()) formData.append("ogDescription", values.ogDescription.trim());
      if (values.ogImage?.trim()) formData.append("ogImage", values.ogImage.trim());
      if (values.twitterCard) formData.append("twitterCard", values.twitterCard);
      if (values.schemaType) formData.append("schemaType", values.schemaType);
      if (values.customFields) formData.append("customFields", JSON.stringify(values.customFields));
      
      let status = values.status;
      if (publishAction === "publish") status = "published";
      else if (publishAction === "schedule") status = "scheduled";
      formData.append("status", status);
      
      if (status === "scheduled" && values.scheduledAt) {
        formData.append("scheduledAt", new Date(values.scheduledAt).toISOString());
      }
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (selectedMediaUrl) {
        formData.append("imageUrl", selectedMediaUrl);
      }
      
      let response;
      if (articleId) {
        response = await api.updateWithUpload(`/news/${articleId}`, formData);
      } else {
        response = await api.upload("/news", formData);
      }
      
      if (response.success) {
        toast({ 
          title: publishAction === "publish" ? "Published!" : publishAction === "schedule" ? "Scheduled!" : "Saved!", 
          description: `Article ${publishAction === "publish" ? "published" : publishAction === "schedule" ? "scheduled" : "saved"} successfully.` 
        });
        navigate("/admin/articles");
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("Error saving article:", error);
      toast({ title: "Error", description: error.message || "Failed to save article", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId || !confirm("Are you sure you want to delete this article?")) return;
    try {
      await api.delete(`/news/${articleId}`);
      toast({ title: "Deleted", description: "Article deleted successfully" });
      navigate("/admin/articles");
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete article", variant: "destructive" });
    }
  };

  const handlePreview = () => {
    if (articleId) {
      window.open(`/article/${article.slug}`, "_blank");
    } else {
      toast({ title: "Save first", description: "Save the article to preview", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      published: <Badge className="bg-green-500">Published</Badge>,
      draft: <Badge variant="outline" className="text-amber-600 border-amber-600">Draft</Badge>,
      scheduled: <Badge className="bg-blue-500">Scheduled</Badge>,
      pending_review: <Badge className="bg-purple-500">Pending Review</Badge>,
    };
    return badges[status] || <Badge variant="outline">Unknown</Badge>;
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{isEditing ? "Edit Article" : "New Article"}</h1>
              <p className="text-sm text-gray-500">
                {isEditing ? article?.title || "Loading..." : "Create a new article"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>•</span>
              <Clock className="h-4 w-4 inline" />
              <span>{readingTime} min read</span>
              {lastSaved && (
                <>
                  <span>•</span>
                  <span className="text-green-600">Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  View Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSubmit(form.getValues(), "save")} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <PublishPanel
              onPublish={() => onSubmit(form.getValues(), "publish")}
              onSchedule={(date) => form.setValue("scheduledAt", date)}
              onSaveDraft={() => onSubmit(form.getValues(), "save")}
              isSaving={isSaving}
              currentStatus={form.watch("status")}
              scheduledAt={form.watch("scheduledAt")}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Editor Tab */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="revisions" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Revisions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Article Content</CardTitle>
                    <CardDescription>Write your article using the rich text editor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <div className="space-y-2 mb-6">
                          <Label>Title</Label>
                          <Input
                            placeholder="Enter article title..."
                            className="text-2xl font-medium"
                            {...field}
                          />
                          <p className="text-xs text-muted-foreground">
                            {field.value?.length || 0} characters
                          </p>
                        </div>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <div className="space-y-2 mb-6">
                          <Label>Summary / Excerpt</Label>
                          <Textarea
                            placeholder="Brief summary for previews and RSS feeds..."
                            className="h-24"
                            {...field}
                          />
                          <p className="text-xs text-muted-foreground">
                            {field.value?.length || 0}/300 characters
                          </p>
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <RichTextEditor
                            content={field.value}
                            onChange={(value) => field.onChange(value)}
                            placeholder="Start writing your article..."
                          />
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Featured Image */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Featured Image
                    </CardTitle>
                    <CardDescription>Upload or select a featured image for this article</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      onImageSelected={handleImageChange}
                      existingImageUrl={previewImage}
                    />
                    {previewImage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Current: {previewImage.split("/").pop()?.split("?")[0]}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setShowMediaLibrary(true)}
                      className="mt-2"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Open Media Library
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <SEOPanel form={form} article={article} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Article Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="articleLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                                <SelectItem value="english">English</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <TagManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Slug</FormLabel>
                            <Input placeholder="auto-generated from title" {...field} />
                            <p className="text-xs text-muted-foreground">Leave empty to auto-generate</p>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Breaking News</Label>
                        <p className="text-sm text-muted-foreground">Show in breaking news ticker</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="isBreaking"
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Featured Article</Label>
                        <p className="text-sm text-muted-foreground">Feature on homepage</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Allow Comments</Label>
                        <p className="text-sm text-muted-foreground">Enable comments on this article</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="allowComments"
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <CustomFieldsPanel form={form} />
              </TabsContent>

              <TabsContent value="revisions" className="space-y-4">
                <RevisionsPanel article={article} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PublishPanel
              onPublish={() => onSubmit(form.getValues(), "publish")}
              onSchedule={(date) => form.setValue("scheduledAt", date)}
              onSaveDraft={() => onSubmit(form.getValues(), "save")}
              isSaving={isSaving}
              currentStatus={form.watch("status")}
              scheduledAt={form.watch("scheduledAt")}
              onPreview={handlePreview}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categories & Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManager
                  categories={categories}
                  selectedCategory={form.watch("category")}
                  onSelectCategory={(id) => form.setValue("category", id)}
                />
                <Separator className="my-4" />
                <TagManager
                  value={form.watch("tags")}
                  onChange={(tags) => form.setValue("tags", tags)}
                />
              </CardContent>
            </Card>

            {isEditing && article && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Featured Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onImageSelected={handleImageChange}
                    existingImageUrl={previewImage}
                  />
                  {article.image && (
                    <Button variant="outline" className="mt-2 w-full" onClick={() => setShowMediaLibrary(true)}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Replace from Media Library
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Subscribers</Label>
                    <p className="text-sm text-muted-foreground">Notify email subscribers</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Push Notification</Label>
                    <p className="text-sm text-muted-foreground">Send push notification</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Social Media</Label>
                    <p className="text-sm text-muted-foreground">Auto-post to social media</p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </CardContent>
            </Card>

            {isEditing && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    Move to Trash
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    This action cannot be undone. The article will be moved to trash.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Media Library Dialog */}
      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>Select an image for your article</DialogDescription>
          </DialogHeader>
          <MediaLibrary onSelect={handleMediaSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ArticleEditor;
