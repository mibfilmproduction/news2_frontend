
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Loader2, X, Share2, Facebook, Twitter, Linkedin, Copy } from "lucide-react";
import { getVideos, VideoType } from "@/services/videoService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

// Fallback videos in case the API fails
const fallbackVideos = {
  hindi: [
    {
      _id: '1',
      title: 'आईपीएल 2025: रोमांचक मैच में मुंबई ने चेन्नई को हराया',
      categoryName: 'खेल',
      thumbnail: 'https://via.placeholder.com/600x400',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'आईपीएल 2025 के एक रोमांचक मुकाबले में मुंबई इंडियंस ने चेन्नई सुपर किंग्स को 5 विकेट से हरा दिया।',
      duration: '5:30',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      _id: '2',
      title: 'प्रधानमंत्री मोदी का विदेश दौरा, अमेरिका के राष्ट्रपति से मुलाकात',
      categoryName: 'राजनीति',
      thumbnail: 'https://via.placeholder.com/600x400',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'प्रधानमंत्री नरेंद्र मोदी ने अपने विदेश दौरे के दौरान अमेरिका के राष्ट्रपति से मुलाकात की और द्विपक्षीय संबंधों पर चर्चा की।',
      duration: '7:15',
      createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    },
    {
      _id: '3',
      title: 'अदा शर्मा ने शेयर किया नया डांस वीडियो, फैंस हुए दीवाने',
      categoryName: 'मनोरंजन',
      thumbnail: 'https://via.placeholder.com/600x400',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'अभिनेत्री अदा शर्मा ने अपने सोशल मीडिया अकाउंट पर एक नया डांस वीडियो शेयर किया है, जिसे देखकर फैंस दीवाने हो गए हैं।',
      duration: '2:10',
      createdAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    },
  ],
  english: [
    {
      _id: '1',
      title: 'IPL 2025: Mumbai beats Chennai in an exciting match',
      categoryName: 'Sports',
      thumbnail: 'https://via.placeholder.com/600x400',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'In an exciting IPL 2025 match, Mumbai Indians defeated Chennai Super Kings by 5 wickets in the last over thriller at Wankhede Stadium.',
      duration: '5:30',
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      _id: '2',
      title: 'PM Modi\'s foreign tour, meeting with the US President',
      categoryName: 'Politics',
      thumbnail: 'https://via.placeholder.com/600x400',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'Prime Minister Narendra Modi met with the US President during his foreign tour to discuss bilateral relations and strategic partnerships.',
      duration: '7:15',
      createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    },
    {
      _id: '3',
      title: 'Ada Sharma shares new dance video, fans go crazy',
      categoryName: 'Entertainment',
      thumbnail: 'https://via.placeholder.com/600x400',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'Actress Ada Sharma shared a new dance video on her social media account that has her fans going wild with excitement.',
      duration: '2:10',
      createdAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    },
  ],
};

// Helper function to format the time difference in a human-readable format
const formatTimeAgo = (dateString: string, lang: "hindi" | "english") => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return lang === "hindi" ? `${interval} साल पहले` : `${interval} ${interval === 1 ? 'year' : 'years'} ago`;
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return lang === "hindi" ? `${interval} महीने पहले` : `${interval} ${interval === 1 ? 'month' : 'months'} ago`;
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return lang === "hindi" ? `${interval} दिन पहले` : `${interval} ${interval === 1 ? 'day' : 'days'} ago`;
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return lang === "hindi" ? `${interval} घंटे पहले` : `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return lang === "hindi" ? `${interval} मिनट पहले` : `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
  }

  return lang === "hindi" ? `अभी अभी` : `just now`;
};

const Videos = () => {
  const [language, setLanguage] = useState<"hindi" | "english">("hindi");
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch from API
        const response = await getVideos(language, page, 9);
        setVideos(response.videos);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos from server. Using local content.');

        // Use fallback videos from our predefined data
        setVideos(fallbackVideos[language] as unknown as VideoType[]);
        setTotalPages(1); // Only one page for fallback videos
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [language, page]);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Latest Videos"
        description="Watch the latest news videos, breaking news coverage, interviews and exclusive video stories on mibDaily News."
        url="/videos"
        keywords={['news videos', 'latest videos', 'video news', 'watch news online', 'mibdaily']}
      />
      {/* Top Advertisement Banner - Full Width */}
      {/* <div className="w-full bg-gray-100 p-4 text-center mb-6 rounded-md">
        <div className="text-sm text-gray-500 mb-2">Advertisement</div>
        <div className="bg-gray-200 h-24 flex items-center justify-center">
          <span className="text-gray-400">Ad Space 960x90</span>
        </div>
      </div> */}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Latest Videos</h1>

        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <Select value={language} onValueChange={(value) => setLanguage(value as "hindi" | "english")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hindi">हिंदी</SelectItem>
              <SelectItem value="english">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[500px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <Card
                key={video._id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedVideo(video);
                  setVideoDialogOpen(true);
                }}
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-100 opacity-80 transition-opacity">
                    <div className="bg-black/70 rounded-full p-3 hover:bg-black/90 transition-colors">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{video.categoryName}</Badge>
                    <span className="text-xs text-gray-500">{formatTimeAgo(video.createdAt, language)}</span>
                  </div>
                  <h3 className="font-bold text-lg">{video.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={page === 1}
              >
                {language === "hindi" ? "पिछला" : "Previous"}
              </Button>
              <span className="flex items-center px-4">
                {language === "hindi" ?
                  `पेज ${page} / ${totalPages}` :
                  `Page ${page} of ${totalPages}`}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                {language === "hindi" ? "अगला" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Video Player Dialog */}
      <Dialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
      >
        <DialogContent className="sm:max-w-5xl w-[calc(100%-2rem)] p-0 overflow-hidden max-h-[90vh]">
          {selectedVideo && (
            <div className="overflow-y-auto">
              {/* Video Player with 16:9 aspect ratio */}
              <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={selectedVideo.videoUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedVideo.title}
                ></iframe>
              </div>

              <div className="p-4 sm:p-6">
                {/* Video Title and Share Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                  <div className="flex-grow">
                    <DialogTitle className="text-xl font-bold leading-tight">{selectedVideo.title}</DialogTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{selectedVideo.categoryName}</Badge>
                      <span className="text-sm text-gray-500">{formatTimeAgo(selectedVideo.createdAt, language)}</span>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <TooltipProvider>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedVideo.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                            }}
                          >
                            <Twitter className="h-4 w-4" />
                            <span className="sr-only">Share on Twitter</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share on Twitter</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                            }}
                          >
                            <Facebook className="h-4 w-4" />
                            <span className="sr-only">Share on Facebook</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share on Facebook</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast({
                                title: "Link copied",
                                description: "Video link copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy link</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy link</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>

                {/* Video Description */}
                {selectedVideo.description && (
                  <DialogDescription className="text-gray-700 mb-6">
                    {selectedVideo.description}
                  </DialogDescription>
                )}

                {/* Related Videos Section */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">{language === "hindi" ? "संबंधित वीडियो" : "Related Videos"}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videos
                      .filter(video => video._id !== selectedVideo._id && video.categoryName === selectedVideo.categoryName)
                      .slice(0, 2)
                      .map(video => (
                        <div
                          key={video._id}
                          className="flex cursor-pointer hover:bg-gray-50 rounded-md overflow-hidden transition-colors duration-200"
                          onClick={() => {
                            setSelectedVideo(video);
                          }}
                        >
                          <div className="w-28 h-20 relative flex-shrink-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                              {video.duration}
                            </div>
                          </div>
                          <div className="p-2 flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-sm font-medium line-clamp-2 leading-tight">{video.title}</h4>
                            <span className="text-xs text-gray-500 mt-1">{formatTimeAgo(video.createdAt, language)}</span>
                          </div>
                        </div>
                      ))}

                    {videos.filter(video => video._id !== selectedVideo._id && video.categoryName === selectedVideo.categoryName).length === 0 && (
                      <p className="text-sm text-gray-500 col-span-2 py-4 text-center bg-gray-50 rounded-md">
                        {language === "hindi" ? "कोई संबंधित वीडियो नहीं मिला" : "No related videos found"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Second Advertisement Space */}
      <div className="w-full bg-gray-100 p-4 text-center mt-8 mb-6 rounded-md">
        <div className="text-sm text-gray-500 mb-2">Advertisement</div>
        <div className="bg-gray-200 h-24 flex items-center justify-center">
          <span className="text-gray-400">Ad Space 960x90</span>
        </div>
      </div>
    </div>
  );
};

export default Videos;
