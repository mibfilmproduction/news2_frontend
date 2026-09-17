import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { sportsApi } from '@/lib/api-client';
import { createSport, updateSport } from '../../services/sportsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MediaImageField from "@/components/admin/MediaImageField";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SportForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [icon, setIcon] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchSport = async () => {
      try {
        setLoading(true);
        const response = await sportsApi.getSport(id as string);
        const sport = (response as any)?.data?.data ?? (response as any)?.data;
        if (!response.success || !sport) {
          throw new Error((response as any)?.message || 'Sport not found');
        }
        setName(sport.name ?? '');
        setSlug(sport.slug ?? '');
        setSlugTouched(true);
        setIcon(sport.icon ?? '');
        setDisplayOrder(sport.displayOrder ?? 0);
        setActive(sport.active ?? true);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || 'Failed to load sport.',
        });
        navigate('/admin/sports');
      } finally {
        setLoading(false);
      }
    };
    fetchSport();
  }, [id, isEditMode, navigate, toast]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Validation", description: "Sport name is required." });
      return;
    }
    const finalSlug = slugify(slug || name);
    if (!finalSlug) {
      toast({ variant: "destructive", title: "Validation", description: "Sport slug is required." });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        slug: finalSlug,
        icon: icon.trim() || 'trophy',
        displayOrder: Number(displayOrder) || 0,
        active,
      };
      if (isEditMode) {
        await updateSport(id as string, payload);
        toast({ title: "Sport Updated", description: `"${payload.name}" has been updated.` });
      } else {
        await createSport(payload as any);
        toast({ title: "Sport Created", description: `"${payload.name}" has been created.` });
      }
      navigate('/admin/sports');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || `Failed to ${isEditMode ? 'update' : 'create'} sport.`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <SEO title={isEditMode ? "Edit Sport" : "Add Sport"} noIndex />

      <Link
        to="/admin/sports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={16} /> Back to Sports
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Sport" : "Add New Sport"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the sport details below."
              : "Create a new sport for the Sports Central page."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sport-name">Name *</Label>
                <Input
                  id="sport-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Cricket"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sport-slug">Slug *</Label>
                <Input
                  id="sport-slug"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                  placeholder="e.g. cricket"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used in the URL: /sports/{slug || 'slug'}. Auto-generated from the name.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sport Icon</Label>
                <MediaImageField
                  value={icon}
                  onChange={setIcon}
                  folder="mibnews/sports"
                  label="Icon"
                />
                <p className="text-xs text-muted-foreground">
                  Upload an icon image file for this sport.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sport-order">Display Order</Label>
                <Input
                  id="sport-order"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium text-sm">Active</div>
                  <div className="text-xs text-muted-foreground">
                    Inactive sports are hidden from the Sports page.
                  </div>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/sports')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex items-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isEditMode ? "Update Sport" : "Create Sport"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SportForm;
