import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Save, Edit3, CheckCircle, Shield,
  UploadCloud, Trash2, PlusCircle, X
} from 'lucide-react';
import axios from 'axios';
import { Badge } from '../ui/badge';
import { API_PATHS } from '@/routes/paths';

const SubAdminProfile = ({ onBack }: { onBack: () => void }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    staffNo: '',
    department: '',
    designation: '',
    contacts: [''],
    photo: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const staffNo = localStorage.getItem('staffNo');
    if (staffNo) {
      setFormData(prev => ({ ...prev, staffNo }));
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(API_PATHS.profile.getProfile, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let { name, staffNo, department, designation, contacts, photoUrl } = res.data;

        // Ensure contacts is always array
        if (typeof contacts === 'string') {
          try { contacts = JSON.parse(contacts); } catch { contacts = []; }
        }
        if (!Array.isArray(contacts)) contacts = [];

        setFormData(prev => ({
          ...prev,
          name: name ?? '',
          staffNo: staffNo ?? '',
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
            toast({ title: 'Error', description: 'Failed to load image', variant: 'destructive' });
            setPreviewUrl(null);
          };
        }

        setIsEditing(false);
      } catch (err) {
        console.error('Profile load error:', err);
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

  const handleRemoveContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleAddContact = () => {
    setFormData(prev => ({ ...prev, contacts: [...prev.contacts, ''] }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPreviewUrl(null);
  };

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleSave = async () => {
    if (!formData.name || !formData.department) {
      toast({ title: "Error", description: "Name and Department are required", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('name', formData.name);
      form.append('staffNo', formData.staffNo);
      form.append('department', formData.department);
      form.append('designation', formData.designation);
      form.append('contacts', JSON.stringify(formData.contacts));
      if (formData.photo) form.append('photo', formData.photo);

const response = await fetch(API_PATHS.profile.updateProfile, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: form, // FormData object
});

      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.message || 'Failed to update profile', variant: 'destructive' });
        return;
      }

      toast({ title: "Success", description: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: 'Update failed.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Avatar */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={previewUrl || '/placeholder-avatar.jpg'} />
            <AvatarFallback>{getInitials(formData.name || 'U')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex gap-2 items-center mb-2">
              <h1 className="text-3xl font-bold">{formData.name || 'Your Name'}</h1>
              <Badge className="bg-purple-100 text-purple-800"><Shield className="h-4 w-4 mr-1" /> SubAdmin</Badge>
              <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-4 w-4 mr-1" /> Active</Badge>
            </div>
            <p className="text-gray-600">{formData.department}</p>
          </div>

          {isEditing ? (
        <div className="space-x-2">
  <Button variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
    <UploadCloud className="h-4 w-4" /> Upload
  </Button>
  <input
    id="photo-upload"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={e => {
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
            <Button onClick={() => setIsEditing(true)}><Edit3 className="h-4 w-4 mr-2" /> Edit</Button>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Staff Number</Label>
              <Input value={formData.staffNo} disabled />
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Input
                value={formData.department}
                onChange={e => handleInputChange('department', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                value={formData.designation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('designation', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="space-y-2">
            <Label>Contact Numbers</Label>
            {formData.contacts.map((contact, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  type="text"
                  value={contact}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const updated = [...formData.contacts];
                    updated[idx] = e.target.value;
                    setFormData(prev => ({ ...prev, contacts: updated }));
                  }}
                  disabled={!isEditing}
                />
                {isEditing && (
                  <Button variant="destructive" onClick={() => handleRemoveContact(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button onClick={handleAddContact} variant="outline" type="button">
                <PlusCircle className="h-4 w-4 mr-1" /> Add Contact
              </Button>
            )}
          </div>

          {/* Save */}
          {isEditing && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-green-700 text-white">
                <Save className="h-4 w-4 mr-2" /> Save Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminProfile;
