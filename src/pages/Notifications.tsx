import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { fetchNotifications, markAllAsRead, NotificationType } from '@/services/notificationService';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications(50).then((list) => {
      setNotifications(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <SEO title="Notifications" description="Latest alerts and updates from Mibnews" url="/notifications" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => { markAllAsRead(); }}>
            Mark all as read
          </Button>
        )}
      </div>
      {loading ? (
        <p className="text-gray-500">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No notifications yet.</Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n._id} className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">{n.type}</p>
              <h2 className="font-semibold mt-1">{n.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </span>
                {n.link && (
                  <Link to={n.link} className="text-sm text-primary hover:underline">
                    View
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
