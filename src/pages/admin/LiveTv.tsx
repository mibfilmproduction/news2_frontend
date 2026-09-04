import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Plus,
  Trash2,
  Upload,
  Star,
  Play,
  RefreshCcw,
  AlertTriangle,
  Share2,
  Newspaper,
  Video,
  Radio
} from "lucide-react";

// AdminLayout is already applied in App.tsx routing
import {
  LiveTvChannel,
  getLiveTvChannels,
  createLiveTvChannel,
  updateLiveTvChannel,
  deleteLiveTvChannel,
  toggleChannelFeatured,
  getLiveTvCategories
} from '@/services/liveTvService';

const AdminLiveTvPage: React.FC = () => {
  const { toast } = useToast();

  // State for channel list
  const [channels, setChannels] = useState<LiveTvChannel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for channel form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<LiveTvChannel | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // State for preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewChannel, setPreviewChannel] = useState<LiveTvChannel | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // State for deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<LiveTvChannel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form refs
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [category, setCategory] = useState('news');
  const [language, setLanguage] = useState('en');
  const [isLive, setIsLive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [order, setOrder] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // State for self news content
  const [isSelfNews, setIsSelfNews] = useState(false);
  const [newsContent, setNewsContent] = useState('');
  const [newsType, setNewsType] = useState('breaking');
  const [newsSource, setNewsSource] = useState('Mibnews');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [currentShareChannel, setCurrentShareChannel] = useState<LiveTvChannel | null>(null);

  // Load channels on mount and when page changes
  useEffect(() => {
    fetchChannels();
  }, [currentPage]);

  // Load categories only once on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function to fetch channels
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { channels, pages } = await getLiveTvChannels({
        page: currentPage,
        limit: 10
      });

      setChannels(channels);
      setTotalPages(pages || Math.ceil(channels.length / 10));

      // If we have many channels but no pages info, calculate it
      if (channels.length > 0 && !pages) {
        setTotalPages(Math.ceil(channels.length / 10));
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load channels. The external API may be unavailable. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const categories = await getLiveTvCategories();
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use default categories if fetch fails
      setCategories(['news', 'entertainment', 'sports', 'education', 'general']);
    }
  };

  // Reset form state
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStreamUrl('');
    setCategory('news');
    setLanguage('en');
    setIsLive(true);
    setIsFeatured(false);
    setOrder(0);
    setThumbnailPreview('');
    setThumbnailFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCurrentChannel(null);
  };

  // Open form for creating a new channel
  const handleAddNew = () => {
    resetForm();
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // Open form for editing a channel
  const handleEdit = (channel: LiveTvChannel) => {
    setCurrentChannel(channel);
    setTitle(channel.title);
    setDescription(channel.description || '');
    setStreamUrl(channel.streamUrl);
    setCategory(channel.category);
    setLanguage(channel.language || 'en');
    setIsLive(channel.isLive);
    setIsFeatured(channel.isFeatured);
    setOrder(channel.order || 0);
    setThumbnailPreview(channel.thumbnailUrl || '');

    setIsEditing(true);
    setIsFormOpen(true);
  };

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required.',
        variant: 'destructive'
      });
      return;
    }

    if (!streamUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Stream URL is required.',
        variant: 'destructive'
      });
      return;
    }

    // Check valid stream URL format
    if (!/^https?:\/\/.+\.(m3u8|mp4|webm|mpd|mp3)($|\?)/.test(streamUrl)) {
      toast({
        title: 'Validation Error',
        description: 'Stream URL must be a valid streaming URL (ends with m3u8, mp4, webm, mpd or mp3).',
        variant: 'destructive'
      });
      return;
    }

    setFormSubmitting(true);

    try {
      const channelData: Partial<LiveTvChannel> = {
        title,
        description,
        streamUrl,
        category,
        language,
        isLive,
        isFeatured,
        order,
        thumbnailUrl: thumbnailPreview || `https://placehold.co/300x200/333/white?text=${encodeURIComponent(title.substring(0, 15))}`,
      };

      let result;

      if (isEditing && currentChannel) {
        // Update existing channel
        result = await updateLiveTvChannel(currentChannel._id, channelData, thumbnailFile);
        toast({
          title: 'Success',
          description: 'Channel updated successfully.',
        });
      } else {
        // Create new channel
        result = await createLiveTvChannel(channelData, thumbnailFile);
        toast({
          title: 'Success',
          description: 'Channel created successfully.',
        });
      }

      // Close form and refresh list
      setIsFormOpen(false);
      fetchChannels();
      resetForm();

    } catch (error) {
      console.error('Error saving channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to save channel. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle channel deletion
  const handleDelete = async () => {
    if (!channelToDelete) return;

    setIsDeleting(true);
    try {
      await deleteLiveTvChannel(channelToDelete._id);

      toast({
        title: 'Success',
        description: 'Channel deleted successfully.',
      });

      // Close dialog and refresh list
      setDeleteDialogOpen(false);
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete channel. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setChannelToDelete(null);
    }
  };

  // Handle toggling featured status
  const handleToggleFeatured = async (channel: LiveTvChannel) => {
    try {
      await toggleChannelFeatured(channel._id);

      // Update local state
      setChannels(channels.map(c =>
        c._id === channel._id
          ? { ...c, isFeatured: !c.isFeatured }
          : c
      ));

      toast({
        title: 'Success',
        description: `Channel ${!channel.isFeatured ? 'added to' : 'removed from'} featured list.`,
      });
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update featured status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle channel preview
  const handlePreview = (channel: LiveTvChannel) => {
    setPreviewChannel(channel);
    setPreviewError(false);
    setPreviewOpen(true);
  };

  // Handle preview player error
  const handlePreviewError = () => {
    setPreviewError(true);
  };

  // Open share dialog
  const handleOpenShareDialog = (channel: LiveTvChannel) => {
    setCurrentShareChannel(channel);
    setIsShareDialogOpen(true);
    setNewsType('breaking');
    setNewsContent('');
    setIsSelfNews(false);
  };

  // Handle share with channel
  const handleShareNews = async () => {
    if (!currentShareChannel) return;

    setShareLoading(false);
    toast({
      title: 'Sharing is not configured',
      description: 'Connect a supported broadcast provider before sharing news to this channel.',
      variant: 'destructive'
    });
  };

  // Toggle self news mode
  const handleToggleSelfNews = () => {
    setIsSelfNews(!isSelfNews);
    if (!isSelfNews) {
      setNewsContent('');
    }
  };

  // Format category for display
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Live TV Channels</h1>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchChannels}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" /> Add Channel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live TV Channels</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No channels found</p>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" /> Add Your First Channel
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel) => (
                    <TableRow key={channel._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={channel.thumbnailUrl || `https://placehold.co/100x60/333/white?text=${encodeURIComponent(channel.title.substring(0, 1))}`}
                            alt={channel.title}
                            className="w-16 h-9 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{channel.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {channel.streamUrl}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatCategory(channel.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={channel.isLive ? "success" : "secondary"}>
                          {channel.isLive ? "Live" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={channel.isFeatured ? "text-yellow-500" : "text-gray-400"}
                          onClick={() => handleToggleFeatured(channel)}
                        >
                          <Star className="h-5 w-5" fill={channel.isFeatured ? "currentColor" : "none"} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePreview(channel)}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleOpenShareDialog(channel)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(channel)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setChannelToDelete(channel);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Channel Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Channel' : 'Add New Channel'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details of this live TV channel.'
                : 'Create a new live TV channel for your viewers.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="mb-2">Channel Title*</Label>
                  <Input
                    id="title"
                    placeholder="Channel Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="streamUrl" className="mb-2">Stream URL*</Label>
                  <Input
                    id="streamUrl"
                    placeholder="https://example.com/stream.m3u8"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    required
                  />
                </div>

            <div>
              <Label htmlFor="description" className="mb-2">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of the channel"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category" className="mb-2">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {formatCategory(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language" className="mb-2">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isLive" className="mb-0">Channel is Live</Label>
              <Switch
                id="isLive"
                checked={isLive}
                onCheckedChange={setIsLive}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isFeatured" className="mb-0">Featured Channel</Label>
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>

            <div>
              <Label htmlFor="order" className="mb-2">Display Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-2">Thumbnail Image</Label>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-1/2">
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Recommended size: 480x270px
              </p>
            </div>

            <div className="w-full md:w-1/2">
              {thumbnailPreview ? (
                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-400">No thumbnail</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setIsFormOpen(false);
            }}
            disabled={formSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={formSubmitting}>
            {formSubmitting ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Saving...
              </>
            ) : isEditing ? (
              'Update Channel'
            ) : (
              'Create Channel'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  {/* Preview Dialog */ }
  <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Channel Preview</DialogTitle>
        <DialogDescription>
          Previewing: {previewChannel?.title}
        </DialogDescription>
      </DialogHeader>

      {previewChannel && (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded overflow-hidden">
            {previewError ? (
              <div className="h-full flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center p-4">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-yellow-500" />
                  <p className="text-lg font-semibold">Stream Unavailable</p>
                  <p className="mt-1 text-gray-300">The stream could not be loaded. It may be offline or the URL may be invalid.</p>
                </div>
              </div>
            ) : (
              <ReactPlayer
                url={previewChannel.streamUrl}
                width="100%"
                height="100%"
                controls
                pip
                onError={handlePreviewError}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium">Category</h4>
              <p>{formatCategory(previewChannel.category)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Language</h4>
              <p className="capitalize">{previewChannel.language}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Status</h4>
              <Badge variant={previewChannel.isLive ? "success" : "secondary"}>
                {previewChannel.isLive ? "Live" : "Offline"}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-gray-600">{previewChannel.description || "No description provided."}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium">Stream URL</h4>
            <p className="text-gray-600 text-sm break-all border p-2 rounded bg-gray-50 dark:bg-gray-900">
              {previewChannel.streamUrl}
            </p>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
        <Button onClick={() => {
          setPreviewOpen(false);
          handleEdit(previewChannel!);
        }}>
          Edit Channel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Delete Confirmation Dialog */ }
  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the channel "{channelToDelete?.title}"? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setDeleteDialogOpen(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner className="mr-2" size="sm" />
              Deleting...
            </>
          ) : (
            'Delete Channel'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Share News Dialog */ }
  <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share News to Channel
        </DialogTitle>
        <DialogDescription>
          {currentShareChannel ? `Share news content to ${currentShareChannel.title}` : 'Select content to share to this channel'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="self-news" className="mb-0">Create Self News</Label>
          <Switch
            id="self-news"
            checked={isSelfNews}
            onCheckedChange={handleToggleSelfNews}
          />
        </div>

        {!isSelfNews ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className={`flex items-center justify-center gap-2 ${newsType === 'breaking' ? 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-800' : ''}`}
                onClick={() => setNewsType('breaking')}
              >
                <Newspaper className="h-4 w-4" />
                Breaking News
              </Button>
              <Button
                variant="outline"
                className={`flex items-center justify-center gap-2 ${newsType === 'video' ? 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-800' : ''}`}
                onClick={() => setNewsType('video')}
              >
                <Video className="h-4 w-4" />
                Video News
              </Button>
              <Button
                variant="outline"
                className={`flex items-center justify-center gap-2 ${newsType === 'live' ? 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-800' : ''}`}
                onClick={() => setNewsType('live')}
              >
                <Radio className="h-4 w-4" />
                Live Update
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center">
                <div className="flex-1">
<Label htmlFor="news-source">News Source</Label>
                    <Input
                      id="news-source"
                      placeholder="Source (e.g. Mibnews)"
                      value={newsSource}
                      onChange={(e) => setNewsSource(e.target.value)}
                    />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your news content here..."
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              rows={6}
            />
            <div className="text-sm text-muted-foreground">
              Write your own news content to share on the channel. This will be displayed as coming from Mibnews.
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col space-y-3">
          <p className="text-sm font-medium mb-2">Share to social media</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-2 text-blue-500">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path>
              </svg>
              Twitter
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2 text-blue-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              Facebook
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2 text-blue-700">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
              </svg>
              LinkedIn
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2 text-green-500">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
              </svg>
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setIsShareDialogOpen(false)}
          disabled={shareLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleShareNews}
          disabled={shareLoading || (isSelfNews && !newsContent.trim())}
        >
          {shareLoading ? (
            <>
              <Spinner className="mr-2" size="sm" />
              Sharing...
            </>
          ) : (
            <>Share Now</>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveTvPage;
