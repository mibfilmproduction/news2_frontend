
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";
import { api } from "@/lib/api-client";

interface SettingsState {
  siteTitle: string;
  siteTagline: string;
  adminEmail: string;
  logoUrl: string;
  faviconUrl: string;
  articlesPerPage: number;
  maintenanceMode: boolean;
  enableComments: boolean;
  requireApproval: boolean;
  enableRegistration: boolean;
  enableSocialLogin: boolean;
  cacheTimeout: number;
  cacheStrategy: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  siteTitle: "Mibnews",
  siteTagline: "The Pinnacle of News Coverage",
  adminEmail: "admin@mibnews.in",
  logoUrl: "/logo.jpeg",
  faviconUrl: "/mib-favicon.png",
  articlesPerPage: 10,
  maintenanceMode: false,
  enableComments: true,
  requireApproval: true,
  enableRegistration: true,
  enableSocialLogin: true,
  cacheTimeout: 60,
  cacheStrategy: "moderate",
};

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { articlesPerPage, maintenanceMode, enableComments, requireApproval,
    enableRegistration, enableSocialLogin, cacheTimeout } = settings;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        if (response.success && response.data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...response.data.general,
            ...response.data.content,
            ...response.data.user,
            ...response.data.performance,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings from server",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateField = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveGroup = async (group: string, groupSettings: Partial<SettingsState>) => {
    setSaving(true);
    try {
      const response = await api.put('/settings', { group, settings: groupSettings });
      if (response.success) {
        toast({
          title: "Settings saved",
          description: "Settings have been updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralSettings = () => {
    saveGroup('general', {
      siteTitle: settings.siteTitle,
      siteTagline: settings.siteTagline,
      adminEmail: settings.adminEmail,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
    });
  };

  const handleSaveContentSettings = () => {
    saveGroup('content', {
      articlesPerPage: settings.articlesPerPage,
      maintenanceMode: settings.maintenanceMode,
    });
  };

  const handleSaveUserSettings = () => {
    saveGroup('user', {
      enableComments: settings.enableComments,
      requireApproval: settings.requireApproval,
      enableRegistration: settings.enableRegistration,
      enableSocialLogin: settings.enableSocialLogin,
    });
  };

  const handleSavePerformanceSettings = () => {
    saveGroup('performance', {
      cacheTimeout: settings.cacheTimeout,
      cacheStrategy: settings.cacheStrategy,
    });
  };

  return (
    <div className="space-y-6">
      <SEO title="Settings" noIndex />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your site settings</p>
      </div>

      <Separator />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users & Comments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Basic information about your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-title">Site Title</Label>
                <Input id="site-title" value={settings.siteTitle} onChange={(e) => updateField('siteTitle', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={settings.siteTagline} onChange={(e) => updateField('siteTagline', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input id="admin-email" type="email" value={settings.adminEmail} onChange={(e) => updateField('adminEmail', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" value={settings.logoUrl} onChange={(e) => updateField('logoUrl', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input id="favicon" value={settings.faviconUrl} onChange={(e) => updateField('faviconUrl', e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneralSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>Manage how content is displayed on your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="articles-per-page">Articles Per Page</Label>
                <Input 
                  id="articles-per-page" 
                  type="number" 
                  value={articlesPerPage} 
                  onChange={(e) => updateField('articlesPerPage', Number(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Put the site in maintenance mode
                  </p>
                </div>
                <Switch 
                  id="maintenance" 
                  checked={maintenanceMode} 
                  onCheckedChange={(v) => updateField('maintenanceMode', v)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveContentSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User & Comment Settings</CardTitle>
              <CardDescription>Manage user registration and commenting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-comments">Enable Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to comment on articles
                  </p>
                </div>
                <Switch 
                  id="enable-comments" 
                  checked={enableComments} 
                  onCheckedChange={(v) => updateField('enableComments', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-approval">Require Comment Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Comments must be approved before being published
                  </p>
                </div>
                <Switch 
                  id="require-approval" 
                  checked={requireApproval} 
                  onCheckedChange={(v) => updateField('requireApproval', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-registration">Enable User Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to register accounts
                  </p>
                </div>
                <Switch 
                  id="enable-registration" 
                  checked={enableRegistration} 
                  onCheckedChange={(v) => updateField('enableRegistration', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-social">Social Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to login with social accounts
                  </p>
                </div>
                <Switch 
                  id="enable-social" 
                  checked={enableSocialLogin} 
                  onCheckedChange={(v) => updateField('enableSocialLogin', v)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveUserSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>Optimize your site's performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cache-timeout">Cache Timeout (minutes)</Label>
                <Input 
                  id="cache-timeout" 
                  type="number" 
                  value={cacheTimeout} 
                  onChange={(e) => updateField('cacheTimeout', Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cache-strategy">Caching Strategy</Label>
                <Select value={settings.cacheStrategy} onValueChange={(v) => updateField('cacheStrategy', v)}>
                  <SelectTrigger id="cache-strategy">
                    <SelectValue placeholder="Select caching strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePerformanceSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default Settings;
