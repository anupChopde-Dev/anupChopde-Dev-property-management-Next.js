import { dummyProperties, dummyRooms, dummyRent, dummyElectricity, dummyExpenses, dummyDashboard } from '../data/dummyData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Helper to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Auth
export const login = async (email, password) => {
  if (email === 'admin@example.com' && password === 'admin123') {
    return { token: 'dummy-jwt-token', user: { email, name: 'Admin' } };
  }
  throw new Error('Invalid credentials');
};

// Properties
export const getProperties = async () => {
  await delay(300);
  return dummyProperties;
};

export const createProperty = async (property) => {
  await delay(300);
  const newProperty = { ...property, id: dummyProperties.length + 1 };
  dummyProperties.push(newProperty);
  return newProperty;
};

export const updateProperty = async (id, property) => {
  await delay(300);
  const index = dummyProperties.findIndex(p => p.id === id);
  if (index !== -1) {
    dummyProperties[index] = { ...dummyProperties[index], ...property };
    return dummyProperties[index];
  }
  throw new Error('Property not found');
};

export const deleteProperty = async (id) => {
  await delay(300);
  const index = dummyProperties.findIndex(p => p.id === id);
  if (index !== -1) {
    dummyProperties.splice(index, 1);
    return true;
  }
  throw new Error('Property not found');
};

// Rooms
export const getRooms = async (propertyId) => {
  await delay(300);
  if (propertyId) {
    return dummyRooms.filter(r => r.propertyId === parseInt(propertyId));
  }
  return dummyRooms;
};

export const createRoom = async (propertyId, room) => {
  await delay(300);
  const newRoom = { ...room, id: dummyRooms.length + 1, propertyId: parseInt(propertyId) };
  dummyRooms.push(newRoom);
  return newRoom;
};

export const updateRoom = async (id, room) => {
  await delay(300);
  const index = dummyRooms.findIndex(r => r.id === id);
  if (index !== -1) {
    dummyRooms[index] = { ...dummyRooms[index], ...room };
    return dummyRooms[index];
  }
  throw new Error('Room not found');
};

export const deleteRoom = async (id) => {
  await delay(300);
  const index = dummyRooms.findIndex(r => r.id === id);
  if (index !== -1) {
    dummyRooms.splice(index, 1);
    return true;
  }
  throw new Error('Room not found');
};

// Rent
export const getRent = async (filters = {}) => {
  await delay(300);
  let filtered = [...dummyRent];
  
  if (filters.propertyId) {
    const roomIds = dummyRooms.filter(r => r.propertyId === parseInt(filters.propertyId)).map(r => r.id);
    filtered = filtered.filter(r => roomIds.includes(r.roomId));
  }
  if (filters.roomId) {
    filtered = filtered.filter(r => r.roomId === parseInt(filters.roomId));
  }
  if (filters.month) {
    filtered = filtered.filter(r => r.month === filters.month);
  }
  if (filters.year) {
    filtered = filtered.filter(r => r.year === parseInt(filters.year));
  }
  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }
  
  return filtered;
};

export const createRent = async (rent) => {
  await delay(300);
  const remaining = rent.rentAmount - rent.paidAmount;
  const status = remaining === 0 ? 'Paid' : remaining === rent.rentAmount ? 'Pending' : 'Partial';
  const newRent = { ...rent, id: dummyRent.length + 1, remaining, status };
  dummyRent.push(newRent);
  return newRent;
};

export const updateRent = async (id, rent) => {
  await delay(300);
  const index = dummyRent.findIndex(r => r.id === id);
  if (index !== -1) {
    const remaining = rent.rentAmount - rent.paidAmount;
    const status = remaining === 0 ? 'Paid' : remaining === rent.rentAmount ? 'Pending' : 'Partial';
    dummyRent[index] = { ...dummyRent[index], ...rent, remaining, status };
    return dummyRent[index];
  }
  throw new Error('Rent record not found');
};

export const deleteRent = async (id) => {
  await delay(300);
  const index = dummyRent.findIndex(r => r.id === id);
  if (index !== -1) {
    dummyRent.splice(index, 1);
    return true;
  }
  throw new Error('Rent record not found');
};

// Electricity
export const getElectricity = async (filters = {}) => {
  await delay(300);
  let filtered = [...dummyElectricity];
  
  if (filters.propertyId) {
    const roomIds = dummyRooms.filter(r => r.propertyId === parseInt(filters.propertyId)).map(r => r.id);
    filtered = filtered.filter(e => roomIds.includes(e.roomId));
  }
  if (filters.roomId) {
    filtered = filtered.filter(e => e.roomId === parseInt(filters.roomId));
  }
  if (filters.month) {
    filtered = filtered.filter(e => e.month === filters.month);
  }
  if (filters.year) {
    filtered = filtered.filter(e => e.year === parseInt(filters.year));
  }
  
  return filtered;
};

export const createElectricity = async (electricity) => {
  await delay(300);
  const units = electricity.currentReading - electricity.previousReading;
  const electricityAmount = units * electricity.ratePerUnit;
  const total = electricityAmount + electricity.otherCharges;
  const newElectricity = { ...electricity, id: dummyElectricity.length + 1, units, electricityAmount, total };
  dummyElectricity.push(newElectricity);
  return newElectricity;
};

export const updateElectricity = async (id, electricity) => {
  await delay(300);
  const index = dummyElectricity.findIndex(e => e.id === id);
  if (index !== -1) {
    const units = electricity.currentReading - electricity.previousReading;
    const electricityAmount = units * electricity.ratePerUnit;
    const total = electricityAmount + electricity.otherCharges;
    dummyElectricity[index] = { ...dummyElectricity[index], ...electricity, units, electricityAmount, total };
    return dummyElectricity[index];
  }
  throw new Error('Electricity record not found');
};

export const deleteElectricity = async (id) => {
  await delay(300);
  const index = dummyElectricity.findIndex(e => e.id === id);
  if (index !== -1) {
    dummyElectricity.splice(index, 1);
    return true;
  }
  throw new Error('Electricity record not found');
};

// Expenses
export const getExpenses = async (roomId) => {
  await delay(300);
  if (roomId) {
    return dummyExpenses.filter(e => e.roomId === parseInt(roomId));
  }
  return dummyExpenses;
};

export const createExpense = async (expense) => {
  await delay(300);
  const newExpense = { ...expense, id: dummyExpenses.length + 1 };
  dummyExpenses.push(newExpense);
  return newExpense;
};

export const updateExpense = async (id, expense) => {
  await delay(300);
  const index = dummyExpenses.findIndex(e => e.id === id);
  if (index !== -1) {
    dummyExpenses[index] = { ...dummyExpenses[index], ...expense };
    return dummyExpenses[index];
  }
  throw new Error('Expense not found');
};

export const deleteExpense = async (id) => {
  await delay(300);
  const index = dummyExpenses.findIndex(e => e.id === id);
  if (index !== -1) {
    dummyExpenses.splice(index, 1);
    return true;
  }
  throw new Error('Expense not found');
};

// Dashboard
export const getDashboard = async () => {
  await delay(300);
  return dummyDashboard;
};
