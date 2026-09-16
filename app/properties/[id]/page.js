'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import MobileNav from '../../../components/MobileNav';
import Card, { CardContent, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { getProperties, getRooms, createRoom, deleteRoom, updateRoom } from '../../../lib/api';
import { Building2, MapPin, Plus, Edit2, Trash2, User, DollarSign, Home } from 'lucide-react';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id;
  
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    tenantName: '',
    tenantPhone: '',
    monthlyRent: '',
    securityDeposit: '',
    occupied: false,
    notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [propertyId, router]);

  const fetchData = async () => {
    try {
      const [propertyData, roomsData] = await Promise.all([
        getProperties().then(props => props.find(p => p.id === parseInt(propertyId))),
        getRooms(propertyId)
      ]);
      setProperty(propertyData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        ...roomFormData,
        monthlyRent: parseFloat(roomFormData.monthlyRent),
        securityDeposit: parseFloat(roomFormData.securityDeposit)
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
      } else {
        await createRoom(propertyId, roomData);
      }
      setShowRoomModal(false);
      setEditingRoom(null);
      setRoomFormData({
        roomNumber: '',
        tenantName: '',
        tenantPhone: '',
        monthlyRent: '',
        securityDeposit: '',
        occupied: false,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      roomNumber: room.roomNumber,
      tenantName: room.tenantName,
      tenantPhone: room.tenantPhone,
      monthlyRent: room.monthlyRent.toString(),
      securityDeposit: room.securityDeposit.toString(),
      occupied: room.occupied,
      notes: room.notes
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (id) => {
    if (confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRoom(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Property not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="p-6">
          <Button
            variant="secondary"
            className="mb-4"
            onClick={() => router.push('/properties')}
          >
            ← Back to Properties
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800">{property.name}</h1>
                  <div className="flex items-center gap-2 text-gray-600 mt-2">
                    <MapPin className="w-5 h-5" />
                    <span>{property.address}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{property.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Rooms</h2>
            <Button onClick={() => { setShowRoomModal(true); setEditingRoom(null); setRoomFormData({ roomNumber: '', tenantName: '', tenantPhone: '', monthlyRent: '', securityDeposit: '', occupied: false, notes: '' }); }}>
              <Plus className="w-5 h-5 mr-2" />
              Add Room
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${room.occupied ? 'bg-green-100' : 'bg-gray-100'} p-3 rounded-full`}>
                        <Home className={`w-6 h-6 ${room.occupied ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Room {room.roomNumber}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${room.occupied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {room.occupied ? 'Occupied' : 'Vacant'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {room.occupied && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>{room.tenantName}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        {room.tenantPhone}
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>₹{room.monthlyRent.toLocaleString()}/month</span>
                  </div>

                  {room.notes && (
                    <p className="text-sm text-gray-500 mb-4">{room.notes}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/properties/${propertyId}/rooms/${room.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3"
                      onClick={() => handleEditRoom(room)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No rooms found</p>
              <Button
                className="mt-4"
                onClick={() => { setShowRoomModal(true); setEditingRoom(null); setRoomFormData({ roomNumber: '', tenantName: '', tenantPhone: '', monthlyRent: '', securityDeposit: '', occupied: false, notes: '' }); }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Room
              </Button>
            </div>
          )}
        </div>
      </main>

      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingRoom ? 'Edit Room' : 'Add Room'}
              </h2>
            </div>
            <form onSubmit={handleRoomSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number
                </label>
                <Input
                  value={roomFormData.roomNumber}
                  onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Name
                </label>
                <Input
                  value={roomFormData.tenantName}
                  onChange={(e) => setRoomFormData({ ...roomFormData, tenantName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Phone
                </label>
                <Input
                  type="tel"
                  value={roomFormData.tenantPhone}
                  onChange={(e) => setRoomFormData({ ...roomFormData, tenantPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (₹)
                </label>
                <Input
                  type="number"
                  value={roomFormData.monthlyRent}
                  onChange={(e) => setRoomFormData({ ...roomFormData, monthlyRent: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit (₹)
                </label>
                <Input
                  type="number"
                  value={roomFormData.securityDeposit}
                  onChange={(e) => setRoomFormData({ ...roomFormData, securityDeposit: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="occupied"
                  checked={roomFormData.occupied}
                  onChange={(e) => setRoomFormData({ ...roomFormData, occupied: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="occupied" className="text-sm font-medium text-gray-700">
                  Occupied
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={roomFormData.notes}
                  onChange={(e) => setRoomFormData({ ...roomFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => { setShowRoomModal(false); setEditingRoom(null); setRoomFormData({ roomNumber: '', tenantName: '', tenantPhone: '', monthlyRent: '', securityDeposit: '', occupied: false, notes: '' }); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingRoom ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
