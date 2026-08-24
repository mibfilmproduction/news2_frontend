import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import { Loader2, MoreHorizontal, Search, RefreshCcw, Trash2, Mail, CheckCircle } from 'lucide-react';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: string;
}

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const messagesPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [currentPage, activeTab, searchTerm]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: messagesPerPage.toString(),
      };
      
      // Add status filter if not 'all'
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      // Add search term if present
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await api.get('/contact', params);
      
      if (response.success && response.data) {
        setMessages(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
        }
      } else {
        setError('Failed to fetch contact messages');
      }
    } catch (err) {
      console.error('Error fetching contact messages:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMessages();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
    
    // If message is new, mark it as read
    if (message.status === 'new') {
      try {
        const response = await api.put(`/contact/${message._id}`, { status: 'read' });
        if (response.success) {
          // Update message in state
          setMessages(prevMessages => 
            prevMessages.map(m => 
              m._id === message._id ? { ...m, status: 'read' } : m
            )
          );
          // Update selected message status
          setSelectedMessage(prev => prev ? { ...prev, status: 'read' } : null);
        }
      } catch (err) {
        console.error('Error updating message status:', err);
      }
    }
  };

  const handleMarkAsResponded = async (id: string) => {
    try {
      const response = await api.put(`/contact/${id}`, { status: 'responded' });
      
      if (response.success) {
        // Update message in state
        setMessages(prevMessages => 
          prevMessages.map(m => 
            m._id === id ? { ...m, status: 'responded' } : m
          )
        );
        
        // Update selected message if it's open
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage({ ...selectedMessage, status: 'responded' });
        }
        
        toast({
          title: "Status updated",
          description: "Message marked as responded",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update status",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error updating message status:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const response = await api.delete(`/contact/${id}`);
      
      if (response.success) {
        // Remove message from state
        setMessages(prevMessages => prevMessages.filter(m => m._id !== id));
        
        // Close dialog if the deleted message is selected
        if (selectedMessage && selectedMessage._id === id) {
          setIsDialogOpen(false);
          setSelectedMessage(null);
        }
        
        toast({
          title: "Message deleted",
          description: "Contact message has been deleted",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete message",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">New</Badge>;
      case 'read':
        return <Badge variant="outline">Read</Badge>;
      case 'responded':
        return <Badge variant="default">Responded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <Button onClick={() => fetchMessages()} variant="outline" size="icon">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="mb-6">
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="search"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </Card>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="responded">Responded</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-8">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No contact messages found
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow 
                      key={message._id}
                      className={message.status === 'new' ? 'font-semibold bg-gray-50' : ''}
                    >
                      <TableCell>{formatDate(message.createdAt)}</TableCell>
                      <TableCell>{message.name}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {message.subject}
                      </TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewMessage(message)}>
                              <Mail className="h-4 w-4 mr-2" />
                              View Message
                            </DropdownMenuItem>
                            {message.status !== 'responded' && (
                              <DropdownMenuItem onClick={() => handleMarkAsResponded(message._id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Responded
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(message._id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(currentPage - 1)} 
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(currentPage + 1)} 
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Message Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedMessage.subject}
                  {getStatusBadge(selectedMessage.status)}
                </DialogTitle>
                <DialogDescription>
                  From: {selectedMessage.name} ({selectedMessage.email})
                  <div className="text-gray-500">
                    Received: {formatDate(selectedMessage.createdAt)}
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 border rounded-md p-4 bg-gray-50 whitespace-pre-line max-h-72 overflow-y-auto">
                {selectedMessage.message}
              </div>
              
              <div className="flex justify-between mt-4">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteMessage(selectedMessage._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                
                {selectedMessage.status !== 'responded' && (
                  <Button
                    onClick={() => {
                      handleMarkAsResponded(selectedMessage._id);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Responded
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactMessages;
