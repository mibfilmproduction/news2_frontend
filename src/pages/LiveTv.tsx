import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactPlayer from 'react-player';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronRight,
  PlayCircle,
  Eye,
  TrendingUp,
  Tv,
  LayoutGrid,
  AlertCircle,
  Info,
  RefreshCcw,
  Settings
} from 'lucide-react';

import Layout from '@/components/Layout';
import { useToast } from "@/hooks/use-toast";
import { LiveTvChannel, getLiveTvChannels, getLiveTvCategories } from '@/services/liveTvService';
import SEO from '@/components/SEO';

const LiveTvPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<LiveTvChannel[]>([]);
  const [featuredChannels, setFeaturedChannels] = useState<LiveTvChannel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<LiveTvChannel | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  // Function to fetch channels
  const fetchChannels = async () => {
    setLoading(true);
    try {
      // Get channels
      const params: any = { limit: 30 };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const { channels } = await getLiveTvChannels(params);
      setChannels(channels);

      // Get featured channels
      const { channels: featured } = await getLiveTvChannels({ featured: true, limit: 5 });
      setFeaturedChannels(featured);

      // If we have channels but no selected channel, select the first one
      if (channels.length > 0 && !selectedChannel) {
        setSelectedChannel(featured.length > 0 ? featured[0] : channels[0]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load live TV channels. Please try again later.',
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
    }
  };

  // Effect to fetch data on mount and when category changes
  useEffect(() => {
    fetchChannels();
  }, [selectedCategory]);

  // Effect to fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle channel selection
  const handleChannelSelect = (channel: LiveTvChannel) => {
    setSelectedChannel(channel);
    setPlayerReady(false);
    setPlayerError(false);

    // Update URL without refreshing page
    navigate(`/live-tv?channel=${channel._id}`, { replace: true });
  };

  // Format category for display
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  };

  // Get fallback thumbnail if not provided
  const getThumbnail = (channel: LiveTvChannel) => {
    return channel.thumbnailUrl ||
      `https://placehold.co/480x270/333/white?text=${encodeURIComponent(channel.title)}`;
  };

  // Handle player ready state
  const handlePlayerReady = () => {
    setPlayerReady(true);
    setPlayerError(false);
  };

  // Handle player error
  const handlePlayerError = () => {
    setPlayerError(true);
    setPlayerReady(false);
    toast({
      title: 'Playback Error',
      description: 'Unable to play this channel. The stream may be offline or unavailable.',
      variant: 'destructive'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Live TV"
        description="Watch live TV channels online for free - live news channels, entertainment and sports streaming on mibDaily News."
        url="/live-tv"
        keywords={['live tv', 'live news channel', 'watch live tv online', 'live streaming', 'mibdaily']}
      />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Tv className="mr-2 h-8 w-8" /> Live TV
          </h1>
          <Button variant="outline" size="sm" onClick={fetchChannels}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Featured Channels */}
        {featuredChannels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" /> Featured Channels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredChannels.map(channel => (
                <Card
                  key={channel._id}
                  className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleChannelSelect(channel)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={getThumbnail(channel)}
                      alt={channel.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity">
                      <PlayCircle className="h-12 w-12 text-white" />
                    </div>
                    {channel.isLive && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-1 py-0.5 rounded">
                        LIVE
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{channel.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                      {channel.description || formatCategory(channel.category)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Player */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-xl">{selectedChannel?.title}</CardTitle>
                {selectedChannel?.description && (
                  <CardDescription>{selectedChannel.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black">
                  {selectedChannel ? (
                    <>
                      {playerError ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Alert variant="destructive" className="w-3/4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Stream Unavailable</AlertTitle>
                            <AlertDescription>
                              This channel's stream is currently unavailable or offline.
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPlayerError(false);
                                    setPlayerReady(false);
                                  }}
                                >
                                  Try Again
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : (
                        <>
                          <ReactPlayer
                            url={selectedChannel.streamUrl}
                            width="100%"
                            height="100%"
                            playing
                            controls
                            onReady={handlePlayerReady}
                            onError={handlePlayerError}
                          />
                          {!playerReady && !playerError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-t-blue-500 border-white mb-4"></div>
                                <p className="text-white">Loading stream...</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No Channel Selected</AlertTitle>
                        <AlertDescription>
                          Please select a channel to start watching.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </CardContent>
              {selectedChannel && (
                <CardFooter className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {formatCategory(selectedChannel.category)}
                    </Badge>
                    {selectedChannel.language && (
                      <Badge variant="outline">
                        {selectedChannel.language.toUpperCase()}
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {selectedChannel.viewCount.toLocaleString()}
                    </Badge>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Channel List */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex items-center">
                  <LayoutGrid className="mr-2 h-5 w-5" /> All Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex-1 flex flex-col">
                <Tabs defaultValue={selectedCategory} value={selectedCategory} onValueChange={setSelectedCategory}>
                  <div className="border-b">
                    <div className="overflow-x-auto pb-2">
                      <TabsList className="h-9">
                        <TabsTrigger value="all" className="h-8">
                          All
                        </TabsTrigger>
                        {categories.map(category => (
                          <TabsTrigger key={category} value={category} className="h-8">
                            {formatCategory(category)}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <TabsContent value={selectedCategory} className="m-0 flex-1">
                    <div className="h-[calc(100vh-300px)] overflow-auto">
                      {loading ? (
                        <div className="space-y-2 p-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center space-x-4 p-2">
                              <Skeleton className="h-16 w-24 rounded" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[150px]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {channels.length === 0 ? (
                            <div className="p-6 text-center">
                              <p className="text-gray-500">No channels found in this category.</p>
                            </div>
                          ) : (
                            channels.map(channel => (
                              <div
                                key={channel._id}
                                className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${selectedChannel?._id === channel._id ? 'bg-gray-100 dark:bg-gray-800' : ''
                                  }`}
                                onClick={() => handleChannelSelect(channel)}
                              >
                                <div className="relative w-24 h-16 mr-4 flex-shrink-0">
                                  <img
                                    src={getThumbnail(channel)}
                                    alt={channel.title}
                                    className="w-full h-full object-cover rounded"
                                  />
                                  {channel.isLive && (
                                    <div className="absolute bottom-1 right-1 bg-red-600 text-white text-xs px-1 rounded">
                                      LIVE
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{channel.title}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{channel.description}</p>
                                  <div className="flex items-center text-xs mt-1">
                                    <Badge variant="outline" className="text-xs py-0 h-5 mr-2">
                                      {formatCategory(channel.category)}
                                    </Badge>
                                    <span className="text-gray-500 flex items-center">
                                      <Eye className="h-3 w-3 mr-1" />
                                      {channel.viewCount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTvPage;
