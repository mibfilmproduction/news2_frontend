import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Trash, 
  Edit, 
  Plus, 
  Eye, 
  BarChart, 
  CheckCircle, 
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { 
  getAdvertisements,
  createAdvertisement, 
  updateAdvertisement, 
  deleteAdvertisement,
  getAdvertisementStats,
  Advertisement
} from "../../services/advertisementService";
import AdvertisementForm from "../../components/admin/AdvertisementForm";
import AdvertisementStats from "../../components/admin/AdvertisementStats";
import { Spinner } from "@/components/Spinner";

const AdminAdvertisements: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Validate authentication token
  useEffect(() => {
    // Function to validate tokens
    const validateTokens = () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Check if token exists
      if (!token || !userStr) {
        toast.error('Authentication required. Please log in.');
        navigate('/login');
        return false;
      }
      
      // Check if user is admin
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin' && user.role !== 'editor') {
          toast.error('You do not have permission to access this page');
          navigate('/');
          return false;
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        toast.error('Authentication error. Please log in again.');
        navigate('/login');
        return false;
      }
      
      return true;
    };
    
    // Run validation on component mount
    validateTokens();
    
    // Listen for auth error events
    const handleAuthError = () => {
      toast.error('Authentication failed. Please login again.');
      navigate('/login');
    };
    
    // Add event listeners for auth events
    window.addEventListener('auth:unauthorized', handleAuthError);
    window.addEventListener('auth:tokenExpired', handleAuthError);
    
    // Clean up listeners
    return () => {
      window.removeEventListener('auth:unauthorized', handleAuthError);
      window.removeEventListener('auth:tokenExpired', handleAuthError);
    };
  }, [navigate]);

  // Fetch all advertisements
  const { data: advertisements, isLoading, error } = useQuery({
    queryKey: ["admin-advertisements"],
    queryFn: async () => {
      try {
        // Use any position and page to get all ads (backend should handle admin requests differently)
        const ads = await getAdvertisements("header", "admin", "hindi", true);
        return ads;
      } catch (error: any) {
        console.error('Error fetching advertisements:', error);
        // Handle authentication errors
        if (error.response?.status === 401) {
          toast.error('Authentication failed. Please login again.');
          navigate('/login');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to access this resource');
          navigate('/');
        }
        throw error;
      }
    },
    retry: false // Don't retry on error
  });

  // Delete advertisement mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAdvertisement,
    onSuccess: () => {
      toast.success("Advertisement deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
    },
    onError: (error: any) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else {
        toast.error("Failed to delete advertisement");
        console.error("Delete error:", error);
      }
    }
  });

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (ad: Advertisement) => {
      return updateAdvertisement(ad._id, { isActive: !ad.isActive });
    },
    onSuccess: () => {
      toast.success("Advertisement status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
    },
    onError: (error: any) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else {
        toast.error("Failed to update advertisement status");
        console.error("Update error:", error);
      }
    }
  });

  // Handle opening the edit modal
  const handleEditClick = (ad: Advertisement) => {
    setSelectedAd(ad);
    setIsEditModalOpen(true);
  };

  // Handle opening the stats modal
  const handleStatsClick = (ad: Advertisement) => {
    setSelectedAd(ad);
    setIsStatsModalOpen(true);
  };

  // Handle deleting an advertisement
  const handleDeleteClick = (adId: string) => {
    if (window.confirm("Are you sure you want to delete this advertisement?")) {
      deleteMutation.mutate(adId);
    }
  };

  // Handle toggling active status
  const handleToggleStatus = (ad: Advertisement) => {
    toggleStatusMutation.mutate(ad);
  };

  // Filter advertisements based on search term and filters
  const filteredAds = advertisements?.filter(ad => {
    let matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesPosition = positionFilter === "all" || ad.position === positionFilter;
    let matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && ad.isActive) || 
      (statusFilter === "inactive" && !ad.isActive);
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Close form modal and refresh data
  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
  };

  if (isLoading) return <Spinner size="lg" />;
  
  if (error) return <div className="p-8 text-red-500">Error loading advertisements</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Advertisements Management</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Advertisement
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search advertisements..."
            className="w-full px-4 py-2 border rounded-md pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              className="appearance-none border rounded-md px-4 py-2 pr-8 bg-white"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="all">All Positions</option>
              <option value="header">Header</option>
              <option value="sidebar">Sidebar</option>
              <option value="footer">Footer</option>
              <option value="in-article">In-Article</option>
              <option value="breaking-news">Breaking News</option>
              <option value="category-header">Category Header</option>
            </select>
            <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="relative">
            <select
              className="appearance-none border rounded-md px-4 py-2 pr-8 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Advertisements Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Advertisement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAds && filteredAds.length > 0 ? (
              filteredAds.map((ad) => (
                <tr key={ad._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={ad.imageUrl} 
                          alt={ad.title} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x80?text=Error';
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {ad.targetUrl}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {ad.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dayjs(ad.startDate).format('MMM D, YYYY')} - {dayjs(ad.endDate).format('MMM D, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleStatus(ad)}
                      className="group flex items-center"
                    >
                      {ad.isActive ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500 group-hover:hidden" />
                          <XCircle className="h-5 w-5 text-gray-400 hidden group-hover:block" />
                          <span className="ml-2 text-sm text-green-600 group-hover:text-gray-500">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-gray-400 group-hover:hidden" />
                          <CheckCircle className="h-5 w-5 text-green-500 hidden group-hover:block" />
                          <span className="ml-2 text-sm text-gray-500 group-hover:text-green-600">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>Impressions: {ad.impressions}</span>
                      <span>Clicks: {ad.clicks}</span>
                      <span>CTR: {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleStatsClick(ad)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Statistics"
                      >
                        <BarChart className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(ad)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Advertisement"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(ad._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Advertisement"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                      <a 
                        href={ad.targetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                        title="Visit Target URL"
                      >
                        <Eye className="h-5 w-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No advertisements found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Form Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {isCreateModalOpen ? "Create Advertisement" : "Edit Advertisement"}
              </h2>
            </div>
            <AdvertisementForm 
              advertisement={isEditModalOpen ? selectedAd : undefined}
              onCancel={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedAd(null);
              }}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsModalOpen && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Advertisement Statistics
              </h2>
              <button 
                onClick={() => {
                  setIsStatsModalOpen(false);
                  setSelectedAd(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <AdvertisementStats advertisementId={selectedAd._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdvertisements;
