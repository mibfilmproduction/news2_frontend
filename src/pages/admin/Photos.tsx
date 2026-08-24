
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Plus, Search, Edit, Trash, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";

// Define form schema for photo validation
const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  alt: z.string().min(2, {
    message: "Alt text is required for accessibility.",
  }),
  imageUrl: z.string().url({
    message: "Please enter a valid image URL.",
  }),
  categoryId: z.string(),
});

type Photo = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  alt: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  views: number;
};

// Mock categories data for dropdown
const categories = [
  { id: "1", name: "राष्ट्रीय" },
  { id: "2", name: "राजनीति" },
  { id: "3", name: "अर्थव्यवस्था" },
  { id: "4", name: "खेल" },
  { id: "5", name: "मनोरंजन" },
  { id: "6", name: "विज्ञान" },
];

// Mock photos data
const initialPhotos: Photo[] = [
  {
    id: 1,
    title: "नया संसद भवन",
    description: "नई दिल्ली में नए संसद भवन का उद्घाटन",
    imageUrl: "https://images.unsplash.com/photo-1526659666544-a3c9ec8a58fc",
    alt: "New Parliament Building",
    categoryId: "1",
    categoryName: "राष्ट्रीय",
    createdAt: "2025-03-15",
    views: 1245
  },
  {
    id: 2,
    title: "क्रिकेट मैच के दौरान विराट कोहली",
    description: "भारत और ऑस्ट्रेलिया के बीच टेस्ट मैच के दौरान विराट कोहली",
    imageUrl: "https://images.unsplash.com/photo-1624821588855-a401883972f9",
    alt: "Virat Kohli during cricket match",
    categoryId: "4",
    categoryName: "खेल",
    createdAt: "2025-03-17",
    views: 3560
  },
  {
    id: 3,
    title: "बिजनेस समिट में फिनटेक विशेषज्ञ",
    description: "वार्षिक वित्तीय समिट के दौरान पैनल चर्चा",
    imageUrl: "https://images.unsplash.com/photo-1591115765373-5207764f72e7",
    alt: "Financial experts discussing at a business panel",
    categoryId: "3",
    categoryName: "अर्थव्यवस्था",
    createdAt: "2025-03-20",
    views: 876
  }
];

const Photos = () => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      alt: "",
      imageUrl: "",
      categoryId: "",
    },
  });

  // Filter photos based on search term
  const filteredPhotos = photos.filter(photo => 
    photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewPhotoDialog = () => {
    setEditingPhoto(null);
    form.reset({
      title: "",
      description: "",
      alt: "",
      imageUrl: "",
      categoryId: "",
    });
    setIsDialogOpen(true);
  };

  const openEditPhotoDialog = (photo: Photo) => {
    setEditingPhoto(photo);
    form.reset({
      title: photo.title,
      description: photo.description || "",
      alt: photo.alt,
      imageUrl: photo.imageUrl,
      categoryId: photo.categoryId,
    });
    setIsDialogOpen(true);
  };

  const handleDeletePhoto = (id: number) => {
    setPhotos(photos.filter(photo => photo.id !== id));
    toast({
      title: "Photo deleted",
      description: "The photo has been deleted successfully.",
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const categoryName = categories.find(cat => cat.id === values.categoryId)?.name || "";

    if (editingPhoto) {
      // Update existing photo
      setPhotos(photos.map(photo => 
        photo.id === editingPhoto.id 
          ? { 
              ...photo, 
              ...values, 
              categoryName 
            } 
          : photo
      ));
      toast({
        title: "Photo updated",
        description: `"${values.title}" has been updated successfully.`,
      });
    } else {
      // Create new photo
      const newPhoto: Photo = {
        id: Math.max(...photos.map(p => p.id)) + 1,
        title: values.title,
        description: values.description || "",
        imageUrl: values.imageUrl,
        alt: values.alt,
        categoryId: values.categoryId,
        categoryName,
        createdAt: new Date().toISOString().split('T')[0],
        views: 0
      };
      setPhotos([...photos, newPhoto]);
      toast({
        title: "Photo added",
        description: `"${values.title}" has been added successfully.`,
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Photos</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={openNewPhotoDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Photo
          </Button>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search photos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.alt} 
                    className="w-full h-full object-cover"
                  />
                  <Badge variant="success" className="absolute top-2 right-2">
                    {photo.views} views
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold truncate">{photo.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{photo.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditPhotoDialog(photo)}>
                          <Edit className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex justify-between text-xs">
                    <Badge variant="outline">{photo.categoryName}</Badge>
                    <span className="text-gray-500">{photo.createdAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No photos found
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPhotos.length > 0 ? (
                filteredPhotos.map((photo) => (
                  <TableRow key={photo.id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={photo.imageUrl}
                          alt={photo.alt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{photo.title}</TableCell>
                    <TableCell>{photo.categoryName}</TableCell>
                    <TableCell>{photo.views}</TableCell>
                    <TableCell>{photo.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditPhotoDialog(photo)}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No photos found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Photo Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingPhoto ? "Edit Photo" : "Add New Photo"}</DialogTitle>
            <DialogDescription>
              {editingPhoto 
                ? "Make changes to the photo details here." 
                : "Add a new photo to the gallery."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Photo title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the photo"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="alt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alt Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Description for screen readers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("imageUrl") && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Preview</label>
                  <div className="h-48 w-full rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={form.watch("imageUrl")}
                      alt="Preview"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                      }}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="submit">
                  {editingPhoto ? "Save Changes" : "Add Photo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Photos;
