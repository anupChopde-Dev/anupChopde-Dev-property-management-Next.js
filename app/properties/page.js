'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import Card, { CardContent } from '../../components/Card';
import Button from '../../components/Button';
import Input, { Label, Textarea } from '../../components/Input';
import Modal from '../../components/Modal';
import { getProperties, createProperty, updateProperty, deleteProperty, getRooms } from '../../lib/api';
import { Building2, Home, MapPin, Plus, Edit2, Trash2, Eye } from 'lucide-react';

const emptyForm = { name: '', address: '', description: '' };

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProperties();
  }, [router]);

  const fetchProperties = async () => {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, formData);
      } else {
        await createProperty(formData);
      }
      setShowModal(false);
      setEditingProperty(null);
      setFormData(emptyForm);
      fetchProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({ name: property.name, address: property.address, description: property.description });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteProperty(id);
        fetchProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };



  const openCreateModal = () => {
    setEditingProperty(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProperty(null);
    setFormData(emptyForm);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading properties…
        </div>
      </div>
    );
  }

  const totalRooms = properties.reduce((sum, property) => sum + (property.roomCount || 0), 0);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Properties
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'} · {totalRooms} rooms
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="h-5 w-5" />
              Add Property
            </Button>
          </header>

          {properties.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className="animate-fade-up hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 dark:hover:border-emerald-400/20"
                >
                  <CardContent className="flex h-full flex-col">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold tracking-tight text-slate-900 dark:text-white">
                          {property.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{property.address}</span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-2 min-h-10 text-sm text-slate-500 dark:text-slate-400">
                      {property.description || 'No description added.'}
                    </p>

                    <div className="mt-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20">
                        <Home className="h-3.5 w-3.5" />
                        {property.roomCount} {property.roomCount === 1 ? 'Room' : 'Rooms'}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/properties/${property.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button variant="secondary" className="px-3" onClick={() => handleEdit(property)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="danger" className="px-3" onClick={() => handleDelete(property.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {properties.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-8 w-8" />
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-100">No properties yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Add your first property to start tracking rooms, rent and electricity bills.
                </p>
                <Button className="mt-5" onClick={openCreateModal}>
                  <Plus className="h-5 w-5" />
                  Add Your First Property
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        subtitle={editingProperty ? 'Update the property details below.' : 'Create a new rental property.'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="property-name">Property Name</Label>
            <Input
              id="property-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Green Villa"
              required
            />
          </div>
          <div>
            <Label htmlFor="property-address">Address</Label>
            <Input
              id="property-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 12 MG Road, Pune"
              required
            />
          </div>
          <div>
            <Label htmlFor="property-description">Description</Label>
            <Textarea
              id="property-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional notes about this property"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingProperty ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      <MobileNav />
    </div>
  );
}
