import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import { getAllSports } from '../../services/sportsService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSports = () => {
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoading(true);
        const data = await getAllSports();
        setSports(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load sports');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sports data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, [toast]);

  const handleCreateSport = () => {
    navigate('/admin/sports/create');
  };

  const handleEditSport = (id: string) => {
    navigate(`/admin/sports/${id}`);
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      // In a real implementation, this would call an API to update the sport
      toast({
        title: "Status Updated",
        description: `Sport status has been ${active ? 'activated' : 'deactivated'}.`,
      });
      
      // Update local state
      setSports(prev => prev.map(sport => 
        sport._id === id ? { ...sport, active } : sport
      ));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update sport status.",
      });
    }
  };

  const handleDeleteSport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sport?')) return;
    
    try {
      // In a real implementation, this would call an API to delete the sport
      toast({
        title: "Sport Deleted",
        description: "The sport has been deleted successfully.",
      });
      
      // Update local state
      setSports(prev => prev.filter(sport => sport._id !== id));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete sport.",
      });
    }
  };

  return (
    <div>
      <SEO title="Manage Sports" noIndex />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Sports</h1>
        <Button onClick={handleCreateSport} className="flex items-center gap-2">
          <PlusCircle size={16} /> Add New Sport
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sports</CardTitle>
          <CardDescription>
            Manage different sports available on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : sports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sports found. Create a new sport to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Display Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sports.map((sport) => (
                  <TableRow key={sport._id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {sport.icon && (
                        <img src={sport.icon} alt={sport.name} className="w-6 h-6" />
                      )}
                      {sport.name}
                    </TableCell>
                    <TableCell>{sport.slug}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={sport.active} 
                          onCheckedChange={(checked) => handleToggleActive(sport._id, checked)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{sport.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditSport(sport._id)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteSport(sport._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Sports Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sports.length}</div>
            <p className="text-muted-foreground text-sm">Sports available on the platform</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sports.filter(sport => sport.active).length}</div>
            <p className="text-muted-foreground text-sm">Currently active sports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sport Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">145</div>
            <p className="text-muted-foreground text-sm">Total matches across all sports</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates to sports content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Created', sport: 'Football', user: 'Admin', time: '2 hours ago' },
              { action: 'Updated', sport: 'Cricket', user: 'Editor', time: '5 hours ago' },
              { action: 'Added match', sport: 'Tennis', user: 'Admin', time: '1 day ago' },
              { action: 'Updated score', sport: 'Cricket', user: 'Editor', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    activity.action === 'Created' ? 'default' : 
                    activity.action === 'Updated' ? 'secondary' : 
                    activity.action === 'Added match' ? 'outline' :
                    'destructive'
                  }>
                    {activity.action}
                  </Badge>
                  <span className="font-medium">{activity.sport}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  by {activity.user} • {activity.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSports;
