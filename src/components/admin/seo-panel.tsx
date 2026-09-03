"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import { getImageUrl } from "@/lib/utils";
import { Globe, Search, Link as LinkIcon, Image as ImageIcon, Twitter, Facebook, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

interface SEOPanelProps {
  form: any;
  article?: any;
}

export function SEOPanel({ form, article }: SEOPanelProps) {
  const metaTitle = form.watch("metaTitle");
  const metaDescription = form.watch("metaDescription");
  const focusKeyword = form.watch("focusKeyword");
  const ogTitle = form.watch("ogTitle");
  const ogDescription = form.watch("ogDescription");
  const ogImage = form.watch("ogImage");
  const canonicalUrl = form.watch("canonicalUrl");
  const articleTitle = form.watch("title");
  const articleSummary = form.watch("summary");
  const articleImage = article?.image;

  const getTitlePreview = () => metaTitle || articleTitle || "Article Title - Site Name";
  const getDescriptionPreview = () => metaDescription || articleSummary || "Article description will appear here...";
  const getImagePreview = () => ogImage || articleImage;

  return (
    <div className="space-y-6">
      {/* SEO Score Card */}
      <Card className="border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            SEO Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {metaTitle ? (metaTitle.length >= 30 && metaTitle.length <= 60 ? "✓" : "⚠") : "○"}
              </div>
              <div className="text-sm text-green-700">Title Length</div>
              <div className="text-xs text-green-600">
                {metaTitle?.length || 0}/60
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">
                {metaDescription ? (metaDescription.length >= 120 && metaDescription.length <= 160 ? "✓" : "⚠") : "○"}
              </div>
              <div className="text-sm text-blue-700">Description Length</div>
              <div className="text-xs text-blue-600">
                {metaDescription?.length || 0}/160
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">
                {focusKeyword ? "✓" : "○"}
              </div>
              <div className="text-sm text-purple-700">Focus Keyword</div>
              <div className="text-xs text-purple-600">
                {focusKeyword ? "Set" : "Not set"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Google Search Preview
          </CardTitle>
          <CardDescription>How your article may appear in Google search results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50 font-mono text-sm">
            <div className="text-green-600 mb-1">https://yoursite.com/{form.watch("slug") || "article-slug"}</div>
            <div className="text-blue-600 font-medium mb-1 truncate">{getTitlePreview()}</div>
            <div className="text-gray-700 line-clamp-2">{getDescriptionPreview()}</div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Main SEO Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Main SEO Settings
          </CardTitle>
          <CardDescription>Optimize for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="focusKeyword"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Focus Keyword</Label>
                <Input
                  placeholder="e.g., breaking news india politics"
                  {...field}
                />
                <p className="text-xs text-muted-foreground">
                  Primary keyword this article should rank for
                </p>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="metaTitle"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  Meta Title
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/60
                  </span>
                </Label>
                <Input
                  placeholder="SEO title (will fallback to article title)"
                  {...field}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use article title. Optimal: 30-60 characters.
                </p>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  Meta Description
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/160
                  </span>
                </Label>
                <Textarea
                  placeholder="SEO description for search results..."
                  className="h-20"
                  {...field}
                />
                <p className="text-xs text-muted-foreground">
                  Optimal: 120-160 characters. Include focus keyword naturally.
                </p>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="canonicalUrl"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Canonical URL
                </Label>
                <Input
                  placeholder="https://yoursite.com/article/canonical-url"
                  {...field}
                />
                <p className="text-xs text-muted-foreground">
                  Prevent duplicate content issues. Leave empty for auto.
                </p>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Open Graph / Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Open Graph (Facebook, LinkedIn, etc.)
          </CardTitle>
          <CardDescription>Control how your article appears when shared on social media</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="ogTitle"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>og:title</Label>
                  <Input placeholder="Social media title" {...field} />
                  <p className="text-xs text-muted-foreground">Defaults to meta title or article title</p>
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="twitterCard"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Twitter Card Type</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="ogDescription"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  og:description
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/200
                  </span>
                </Label>
                <Textarea
                  placeholder="Social media description..."
                  className="h-20"
                  {...field}
                />
                <p className="text-xs text-muted-foreground">Optimal: 150-200 characters</p>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="ogImage"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  og:image
                </Label>
                <ImageUpload
                  onImageSelected={(file) => {
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => field.onChange(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      field.onChange("");
                    }
                  }}
                  existingImageUrl={field.value || getImagePreview() || ""}
                />
                <p className="text-xs text-muted-foreground">Recommended: 1200x630px. Will use featured image if empty.</p>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Twitter Card Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-blue-500" />
            Twitter Card Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white max-w-xs">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span>@yoursite</span>
              <span>·</span>
              <span>Just now</span>
            </div>
            {getImagePreview() && (
              <img src={getImageUrl(getImagePreview())} alt="" className="w-full h-48 object-cover rounded mb-3" />
            )}
            <div className="font-bold mb-1">{ogTitle || getTitlePreview()}</div>
            <div className="text-sm text-gray-600 line-clamp-2">{ogDescription || getDescriptionPreview()}</div>
            <div className="text-xs text-gray-400 mt-2">yoursite.com</div>
          </div>
        </CardContent>
      </Card>

      {/* Schema Markup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Schema.org Markup
          </CardTitle>
          <CardDescription>Structured data for rich search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="schemaType"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Article Type</Label>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schema type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NewsArticle">News Article</SelectItem>
                    <SelectItem value="Article">Generic Article</SelectItem>
                    <SelectItem value="BlogPosting">Blog Post</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the most appropriate schema type for your content
                </p>
              </div>
            )}
          />

          <div className="p-4 bg-gray-50 rounded-lg text-sm font-mono text-gray-700 max-h-64 overflow-auto">
            <pre>{JSON.stringify({
              "@context": "https://schema.org",
              "@type": form.watch("schemaType") || "NewsArticle",
              headline: metaTitle || articleTitle,
              description: metaDescription || articleSummary,
              image: [getImagePreview() ? getImageUrl(getImagePreview()) : ""],
              datePublished: article?.publishedAt || new Date().toISOString(),
              dateModified: article?.updatedAt || new Date().toISOString(),
              author: {
                "@type": "Person",
                name: article?.author?.name || "Author Name"
              },
              publisher: {
                "@type": "Organization",
                name: "Your Site Name",
                logo: {
                  "@type": "ImageObject",
                  url: "https://yoursite.com/logo.png"
                }
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": canonicalUrl || "https://yoursite.com/article/slug"
              }
            }, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SEOPanel;