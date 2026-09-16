/**
 * Real API client for the Property Management backend.
 *
 * Every function returns plain objects shaped for the UI:
 *  - ids stay as backend strings (Mongo ObjectId) unless normalized
 *  - months are "YYYY-MM" (billingMonth); year derived for filters
 *  - statuses stay backend-style: Paid / Partial / Pending
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-09" -> "September 2026" */
const monthLabel = (billingMonth) => {
  if (!billingMonth) return '';
  const [y, m] = billingMonth.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

const num = (v) => (v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v));

const isoDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = {};
  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    throw new ApiError(json?.message || `Request failed (${res.status})`, res.status);
  }
  return json?.data !== undefined ? json.data : json;
};

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const login = async (email, password) => {
  const data = await request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user || {}));
  }
  return data;
};

export const getMe = () => request('/api/auth/me');

export const logout = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/* ------------------------------------------------------------------ */
/* Properties                                                          */
/* ------------------------------------------------------------------ */

const normalizeProperty = (p) => ({
  id: p._id || p.id,
  name: p.name,
  address: [p.address, p.city, p.state].filter(Boolean).join(', '),
  description: p.description || '',
  totalRooms: p.totalRooms ?? 0,
  occupiedRooms: p.occupiedRooms ?? 0,
  roomCount: p.totalRooms ?? 0,
});

export const getProperties = async () => {
  const data = await request('/api/properties');
  return (Array.isArray(data) ? data : []).map(normalizeProperty);
};

export const getProperty = (id) => request(`/api/properties/${id}`);

export const createProperty = async (property) => {
  const data = await request('/api/properties', { method: 'POST', body: property });
  return normalizeProperty(data);
};

export const updateProperty = (id, property) =>
  request(`/api/properties/${id}`, { method: 'PUT', body: property });

export const deleteProperty = (id) =>
  request(`/api/properties/${id}`, { method: 'DELETE' });

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

const normalizeRoom = (r) => ({
  id: r._id || r.id,
  propertyId: r.propertyId || r.property,
  propertyName: r.propertyName || null,
  roomNumber: r.roomNumber,
  floor: r.floor || '',
  tenantName: r.tenantName || r.currentTenant?.fullName || '',
  tenantPhone: r.tenantPhone || r.currentTenant?.mobile || '',
  monthlyRent: num(r.monthlyRent),
  securityDeposit: num(r.securityDeposit),
  occupied: r.occupied ?? r.status === 'OCCUPIED',
  status: r.status || (r.occupied ? 'OCCUPIED' : 'VACANT'),
  notes: r.notes || '',
});

export const getRooms = async (propertyId) => {
  const data = propertyId
    ? await request(`/api/properties/${propertyId}/rooms`)
    : await request('/api/rooms');
  return (Array.isArray(data) ? data : []).map(normalizeRoom);
};

export const getRoom = (id) => request(`/api/rooms/${id}`);

export const createRoom = async (propertyId, room) => {
  const data = await request(`/api/properties/${propertyId}/rooms`, { method: 'POST', body: room });
  return normalizeRoom(data);
};

export const updateRoom = (id, room) =>
  request(`/api/rooms/${id}`, { method: 'PUT', body: room });

export const deleteRoom = (id) =>
  request(`/api/rooms/${id}`, { method: 'DELETE' });

/* ------------------------------------------------------------------ */
/* Tenants                                                             */
/* ------------------------------------------------------------------ */

export const getTenants = (filters = {}) =>
  request(`/api/tenants${qs(filters)}`);

export const getTenant = (id) => request(`/api/tenants/${id}`);

/** URL that serves the tenant photo directly from the backend (Buffer in MongoDB) */
export const tenantPhotoUrl = (id) => `${API_BASE}/api/tenants/${id}/photo`;

/** Upload document(s) for a tenant via multipart/form-data */
export const uploadTenantDocument = (tenantId, formData) =>
  request(`/api/tenants/${tenantId}/documents`, { method: 'POST', body: formData });

/** List uploaded documents for a tenant */
export const getTenantDocuments = (tenantId) =>
  request(`/api/tenants/${tenantId}/documents`);

export const createTenant = (tenant, photoFile) => {
  if (!photoFile) {
    return request('/api/tenants', { method: 'POST', body: tenant });
  }
  // Multipart so the backend can store the photo as a Buffer in MongoDB
  const form = new FormData();
  Object.entries(tenant).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  });
  form.append('photo', photoFile);
  return request('/api/tenants', { method: 'POST', body: form });
};

export const updateTenant = (id, tenant) =>
  request(`/api/tenants/${id}`, { method: 'PUT', body: tenant });

export const moveOutTenant = (id) =>
  request(`/api/tenants/${id}/move-out`, { method: 'POST' });

/* ------------------------------------------------------------------ */
/* Rent                                                                */
/* ------------------------------------------------------------------ */

const normalizeRent = (r) => {
  const rentAmount = num(r.rentAmount);
  const paidAmount = num(r.totalPaid ?? r.paidAmount);
  return {
    id: r._id || r.id,
    roomId: r.roomId || r.room,
    roomNumber: r.roomName || r.roomNumber || '',
    propertyId: r.propertyId || null,
    propertyName: r.propertyName || '',
    tenantName: r.tenantName || '',
    month: r.billingMonth || '',          // "YYYY-MM"
    monthLabel: monthLabel(r.billingMonth),
    year: r.billingMonth ? Number(r.billingMonth.split('-')[0]) : null,
    monthNumber: r.billingMonth ? Number(r.billingMonth.split('-')[1]) : null,
    rentAmount,
    paidAmount,
    remaining: num(r.outstanding ?? rentAmount - paidAmount),
    status: r.status === 'PAID' ? 'Paid' : r.status === 'PARTIAL' ? 'Partial' : r.status === 'OVERDUE' ? 'Overdue' : 'Pending',
    dueDate: isoDate(r.dueDate),
    paymentDate: r.payments?.[0]?.paymentDate ? isoDate(r.payments[0].paymentDate) : '',
    paymentMethod: r.payments?.[0]?.paymentMethod || '',
    notes: r.notes || '',
    payments: r.payments || [],
  };
};

export const getRent = async (filters = {}) => {
  const params = {
    propertyId: filters.propertyId || '',
    roomId: filters.roomId || '',
    billingMonth: filters.month || '',
    status: filters.status ? filters.status.toUpperCase() : '',
  };
  const data = await request(`/api/rent-charges${qs(params)}`);
  return (Array.isArray(data) ? data : []).map(normalizeRent);
};

export const getRentCharge = (id) => request(`/api/rent-charges/${id}`);

export const createRent = async (rent) => {
  const payload = {
    room: rent.roomId,
    billingMonth: rent.month,
    rentAmount: num(rent.rentAmount),
    dueDate: rent.dueDate || undefined,
    notes: rent.notes || undefined,
  };
  if (rent.tenantId) payload.tenant = rent.tenantId;
  const data = await request('/api/rent-charges', { method: 'POST', body: payload });
  return normalizeRent(data);
};

export const updateRent = (id, rent) =>
  request(`/api/rent-charges/${id}`, { method: 'PUT', body: rent });

export const deleteRent = (id) =>
  request(`/api/rent-charges/${id}`, { method: 'DELETE' });

export const addRentPayment = (chargeId, payment) =>
  request(`/api/rent-charges/${chargeId}/payments`, { method: 'POST', body: payment });

export const getRentPayments = (chargeId) =>
  request(`/api/rent-charges/${chargeId}/payments`);

/** Get the previous meter reading for a room (used to prefill electricity form) */
export const getPreviousReading = (roomId, billingMonth) =>
  request(`/api/electricity/previous-reading/${roomId}/${billingMonth}`);

/* ------------------------------------------------------------------ */
/* Electricity                                                         */
/* ------------------------------------------------------------------ */

const normalizeElectricity = (e) => {
  const previousReading = num(e.previousReading);
  const currentReading = num(e.currentReading);
  const units = e.consumedUnits !== undefined ? num(e.consumedUnits) : currentReading - previousReading;
  const electricityAmount = e.energyAmount !== undefined ? num(e.energyAmount) : units * num(e.ratePerUnit);
  const otherCharges = e.otherCharge !== undefined ? num(e.otherCharge) : num(e.otherCharges);
  return {
    id: e._id || e.id,
    roomId: e.roomId || e.room,
    roomNumber: e.roomName || e.roomNumber || '',
    propertyId: e.propertyId || e.property || null,
    propertyName: e.propertyName || '',
    tenantName: e.tenantName || '',
    month: e.billingMonth || '',
    monthLabel: monthLabel(e.billingMonth),
    year: e.billingMonth ? Number(e.billingMonth.split('-')[0]) : null,
    monthNumber: e.billingMonth ? Number(e.billingMonth.split('-')[1]) : null,
    billDate: isoDate(e.readingDate),
    previousReading,
    currentReading,
    ratePerUnit: num(e.ratePerUnit),
    units,
    electricityAmount,
    fixedCharge: num(e.fixedCharge),
    otherCharges,
    total: e.totalAmount !== undefined ? num(e.totalAmount) : electricityAmount + otherCharges,
    notes: e.notes || '',
  };
};

export const getElectricity = async (filters = {}) => {
  const params = {
    propertyId: filters.propertyId || '',
    roomId: filters.roomId || '',
    billingMonth: filters.month || '',
  };
  const data = await request(`/api/electricity${qs(params)}`);
  return (Array.isArray(data) ? data : []).map(normalizeElectricity);
};

export const createElectricity = async (record) => {
  const payload = {
    room: record.roomId,
    billingMonth: record.month,
    previousReading: num(record.previousReading),
    currentReading: num(record.currentReading),
    ratePerUnit: num(record.ratePerUnit),
    readingDate: record.billDate || new Date().toISOString().slice(0, 10),
    fixedCharge: num(record.fixedCharge),
    otherCharge: num(record.otherCharges),
  };
  if (record.tenantId) payload.tenant = record.tenantId;
  if (record.notes) payload.notes = record.notes;
  const data = await request('/api/electricity/readings', { method: 'POST', body: payload });
  return normalizeElectricity(data);
};

export const updateElectricity = (id, record) =>
  request(`/api/electricity/readings/${id}`, { method: 'PUT', body: record });

export const deleteElectricity = (id) =>
  request(`/api/electricity/readings/${id}`, { method: 'DELETE' });

/* ------------------------------------------------------------------ */
/* Expenses                                                            */
/* ------------------------------------------------------------------ */

const normalizeExpense = (e) => ({
  id: e._id || e.id,
  propertyId: e.propertyId || e.property,
  propertyName: e.propertyName || '',
  roomId: e.roomId || e.room || null,
  roomNumber: e.roomName || '',
  name: e.description || e.name || '',
  category: e.category || 'OTHER',
  amount: num(e.amount),
  date: isoDate(e.date),
  notes: e.notes || '',
});

export const getExpenses = async (filters = {}) => {
  const params = {
    propertyId: filters.propertyId || '',
    roomId: filters.roomId || '',
    category: filters.category || '',
    fromDate: filters.fromDate || '',
    toDate: filters.toDate || '',
  };
  const data = await request(`/api/expenses${qs(params)}`);
  return (Array.isArray(data) ? data : []).map(normalizeExpense);
};

export const createExpense = async (expense) => {
  const data = await request('/api/expenses', {
    method: 'POST',
    body: {
      property: expense.propertyId,
      room: expense.roomId || null,
      category: expense.category || 'OTHER',
      amount: num(expense.amount),
      date: expense.date || new Date().toISOString().slice(0, 10),
      description: expense.name,
      notes: expense.notes,
    },
  });
  return normalizeExpense(data);
};

export const updateExpense = (id, expense) =>
  request(`/api/expenses/${id}`, { method: 'PUT', body: expense });

export const deleteExpense = (id) =>
  request(`/api/expenses/${id}`, { method: 'DELETE' });

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const getDashboard = async () => {
  const data = await request('/api/dashboard');
  return {
    totalProperties: data?.stats?.totalProperties ?? 0,
    totalRooms: data?.stats?.totalRooms ?? 0,
    occupiedRooms: data?.stats?.occupiedRooms ?? 0,
    vacantRooms: data?.stats?.vacantRooms ?? 0,
    expectedRent: data?.finance?.expectedRent ?? 0,
    collectedRent: data?.finance?.collectedRent ?? 0,
    pendingRent: data?.finance?.outstandingRent ?? 0,
    electricityExpense: data?.finance?.electricityCharges ?? 0,
    otherExpenses: data?.finance?.totalExpenses ?? 0,
    currentMonth: data?.currentMonth || '',
    alerts: data?.alerts || {},
  };
};
