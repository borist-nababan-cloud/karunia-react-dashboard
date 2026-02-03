'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Edit, Plus, FileImage, Trash2, Image as ImageIcon } from 'lucide-react';
import { createCRUDAPI, uploadFile } from '@/services/api';
import { getImageUrl, getOptimalImageUrl } from '@/utils/imageUtils';

interface Article {
  id: number;
  documentId: string;
  title: string;
  description: string;
  slug: string | null;
  cover?: {
    id: number;
    documentId: string;
    name: string;
    alternativeText?: string;
    caption?: string;
    width: number;
    height: number;
    formats?: {
      thumbnail?: {
        url: string;
        width: number;
        height: number;
      };
      small?: {
        url: string;
        width: number;
        height: number;
      };
      medium?: {
        url: string;
        width: number;
        height: number;
      };
    };
    url: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

const articlesAPI = createCRUDAPI('articles');

const MAX_DESCRIPTION_LENGTH = 80;

export default function InformationPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Fetch articles
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.find();
      setArticles(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
    setImagePreview(null);
    setSelectedFile(null);
    // Clear both file inputs
    if (createFileInputRef.current) {
      createFileInputRef.current.value = '';
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    if (field === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      return; // Prevent typing beyond max length
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = (modalType: 'create' | 'edit') => {
    setSelectedFile(null);
    setImagePreview(null);
    // Clear the appropriate file input
    if (modalType === 'create' && createFileInputRef.current) {
      createFileInputRef.current.value = '';
    } else if (modalType === 'edit' && editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Handle create article
  const handleCreateArticle = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      let coverId = null;

      // Upload image if selected
      if (selectedFile) {
        const uploadResponse = await uploadFile(selectedFile);
        if (uploadResponse && uploadResponse.length > 0) {
          coverId = uploadResponse[0].id;
        }
      }

      // Create article
      const articleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        cover: coverId,
      };

      await articlesAPI.create(articleData);
      toast.success('Article created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchArticles();
    } catch (error: any) {
      console.error('Failed to create article:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to create article');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit article
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      description: article.description,
    });
    setImagePreview(article.cover ? getOptimalImageUrl(article.cover) : null);
    setSelectedFile(null);
    setIsEditModalOpen(true);
  };

  // Handle update article
  const handleUpdateArticle = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (!editingArticle) return;

    setIsSubmitting(true);
    try {
      let coverId = editingArticle.cover?.id || null;

      // Upload new image if selected
      if (selectedFile) {
        const uploadResponse = await uploadFile(selectedFile);
        if (uploadResponse && uploadResponse.length > 0) {
          coverId = uploadResponse[0].id;
        }
      }

      // Update article
      const articleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        cover: coverId,
      };

      await articlesAPI.update(editingArticle.documentId, articleData);
      toast.success('Article updated successfully');
      setIsEditModalOpen(false);
      setEditingArticle(null);
      resetForm();
      fetchArticles();
    } catch (error: any) {
      console.error('Failed to update article:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update article');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modals
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingArticle(null);
    resetForm();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Information</h1>
              <p className="text-gray-600">Manage articles and announcements</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Article
            </Button>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : articles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No articles found. Create your first article to get started.
              </div>
            ) : (
              articles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Cover Image */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {article.cover ? (
                      <img
                        src={getOptimalImageUrl(article.cover)}
                        alt={article.cover.alternativeText || article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditArticle(article)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Title */}
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {article.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {article.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Created: {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {article.description.length}/{MAX_DESCRIPTION_LENGTH} chars
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Create Article Modal */}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
                <DialogDescription>
                  Add a new article with title, description, and cover image.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter article title"
                    className="mt-1"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter article description"
                    className="mt-1 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Maximum {MAX_DESCRIPTION_LENGTH} characters</span>
                    <span className={formData.description.length === MAX_DESCRIPTION_LENGTH ? 'text-orange-500 font-medium' : ''}>
                      {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <Label htmlFor="create-cover">Cover Image</Label>
                  <div className="mt-1">
                    <input
                      ref={createFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="create-cover"
                    />
                    <label htmlFor="create-cover">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors">
                        {imagePreview ? (
                          <div className="space-y-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-md"
                            />
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500">Click to change image</p>
                              {selectedFile && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveImage('create');
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload cover image
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateArticle}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Article'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Article Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Article</DialogTitle>
                <DialogDescription>
                  Update article details and cover image.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter article title"
                    className="mt-1"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter article description"
                    className="mt-1 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Maximum {MAX_DESCRIPTION_LENGTH} characters</span>
                    <span className={formData.description.length === MAX_DESCRIPTION_LENGTH ? 'text-orange-500 font-medium' : ''}>
                      {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <Label htmlFor="edit-cover">Cover Image</Label>
                  <div className="mt-1">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="edit-cover"
                    />
                    <label htmlFor="edit-cover">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors">
                        {imagePreview ? (
                          <div className="space-y-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-md"
                            />
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500">Click to change image</p>
                              {selectedFile && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveImage('edit');
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload cover image
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateArticle}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Article'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}