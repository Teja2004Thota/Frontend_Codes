import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Save, Edit3, CheckCircle, UploadCloud, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';

const ProfileManager = ({ onBack }: { onBack: () => void }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    staffNo: '',
    department: '',
    photo: null as File | null,
    designation: '',
    contacts: ['']
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const staffNo = localStorage.getItem('staffNo');
    if (staffNo) {
      setFormData(prev => ({ ...prev, staffNo }));
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_PATHS.profile.getProfile, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true, // ✅ ADD THIS
        });

        let { staffNo, name, department, designation, contacts, photoUrl } = res.data;

        if (typeof contacts === 'string') {
          try {
            contacts = JSON.parse(contacts);
          } catch {
            contacts = [];
          }
        }
        if (!Array.isArray(contacts)) contacts = [];

        setFormData(prev => ({
          ...prev,
          staffNo: staffNo ?? '',
          name: name ?? '',
          department: department ?? '',
          designation: designation ?? '',
          contacts,
          photo: null,
        }));

        if (photoUrl) {
          const img = new Image();
          img.src = photoUrl;
          img.onload = () => setPreviewUrl(photoUrl);
          img.onerror = () => {
            console.error('Failed to load image:', photoUrl);
            setPreviewUrl(null);
            toast({
              title: 'Error',
              description: 'Failed to load profile image',
              variant: 'destructive',
            });
          };
        }

        setIsEditing(false);
      } catch (err) {
        console.log('No existing profile found or error fetching profile:', err);
        setIsEditing(true);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'photo' && value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPreviewUrl(null);
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('name', formData.name);
      form.append('department', formData.department); // still included, but not editable
      form.append('designation', formData.designation ?? '');
      form.append('contacts', JSON.stringify(formData.contacts || []));
      if (formData.photo) form.append('photo', formData.photo);

      const response = await fetch(API_PATHS.profile.updateProfile, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Error", description: data.message || 'Failed to update profile', variant: 'destructive' });
        return;
      }

      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully"
      });

      setIsEditing(false);
    } catch (error) {
      toast({ title: "Error", description: 'Something went wrong', variant: 'destructive' });
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="w-24 h-24 relative">
            <AvatarImage src={previewUrl || '/placeholder-avatar.jpg'} />
            <AvatarFallback className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {getInitials(formData.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{formData.name || 'Your Name'}</h1>
              <div className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </div>
            </div>
            <p className="text-gray-600">{formData.department}</p>
          </div>

          {isEditing ? (
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <UploadCloud className="h-4 w-4" />
                Upload
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleInputChange('photo', file);
                }}
              />
              {previewUrl && (
                <Button variant="destructive" onClick={handleImageRemove}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} disabled={isEditing}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name ?? ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Staff Number (Read-Only)</Label>
              <Input value={formData.staffNo ?? ''} disabled />
            </div>

<div className="space-y-2">
  <Label>Department {formData.department ? '' : '*'}</Label>
  {formData.department && !isEditing ? (
    <Input value={formData.department} disabled />
  ) : (
    <Input
      type="text"
      value={formData.department}
      onChange={(e) => handleInputChange('department', e.target.value)}
      disabled={!isEditing}
      placeholder="Enter your department"
    />
  )}
</div>



            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                value={formData.designation ?? ''}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Numbers</Label>
            {(formData.contacts ?? []).map((contact, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  type="text"
                  value={contact ?? ''}
                  onChange={(e) => {
                    const updated = [...formData.contacts];
                    updated[index] = e.target.value;
                    setFormData(prev => ({ ...prev, contacts: updated }));
                  }}
                  disabled={!isEditing}
                />
                {isEditing && (
                  <Button variant="destructive" onClick={() => {
                    const updated = formData.contacts.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, contacts: updated }));
                  }}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button onClick={() => setFormData(prev => ({ ...prev, contacts: [...prev.contacts, ''] }))}>
                Add Contact
              </Button>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileManager;
