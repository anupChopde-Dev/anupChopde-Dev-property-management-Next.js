export const dummyProperties = [
  {
    id: 1,
    name: 'Property A',
    address: '123 Main Street, City',
    description: '3-story building with 5 rooms'
  },
  {
    id: 2,
    name: 'Property B',
    address: '456 Oak Avenue, City',
    description: '2-story building with 5 rooms'
  }
];

export const dummyRooms = [
  {
    id: 1,
    propertyId: 1,
    roomNumber: '101',
    tenantName: 'Rahul',
    tenantPhone: '9876543210',
    monthlyRent: 8000,
    securityDeposit: 24000,
    occupied: true,
    notes: 'Long-term tenant'
  },
  {
    id: 2,
    propertyId: 1,
    roomNumber: '102',
    tenantName: 'Amit',
    tenantPhone: '9876543211',
    monthlyRent: 7000,
    securityDeposit: 21000,
    occupied: true,
    notes: 'Pays on time'
  },
  {
    id: 3,
    propertyId: 1,
    roomNumber: '103',
    tenantName: '',
    tenantPhone: '',
    monthlyRent: 7500,
    securityDeposit: 22500,
    occupied: false,
    notes: 'Recently vacated'
  },
  {
    id: 4,
    propertyId: 2,
    roomNumber: '201',
    tenantName: 'Priya',
    tenantPhone: '9876543212',
    monthlyRent: 9000,
    securityDeposit: 27000,
    occupied: true,
    notes: 'New tenant'
  },
  {
    id: 5,
    propertyId: 2,
    roomNumber: '202',
    tenantName: 'Suresh',
    tenantPhone: '9876543213',
    monthlyRent: 8500,
    securityDeposit: 25500,
    occupied: true,
    notes: 'Family of 3'
  }
];

export const dummyRent = [
  {
    id: 1,
    roomId: 1,
    month: 'January',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-01-05',
    paymentMethod: 'Cash',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 2,
    roomId: 1,
    month: 'February',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-02-05',
    paymentMethod: 'Bank Transfer',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 3,
    roomId: 1,
    month: 'March',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-03-05',
    paymentMethod: 'Cash',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 4,
    roomId: 1,
    month: 'April',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-04-05',
    paymentMethod: 'Bank Transfer',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 5,
    roomId: 1,
    month: 'May',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-05-05',
    paymentMethod: 'Cash',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 6,
    roomId: 1,
    month: 'June',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-06-05',
    paymentMethod: 'Bank Transfer',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 7,
    roomId: 1,
    month: 'July',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-07-05',
    paymentMethod: 'Cash',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 8,
    roomId: 1,
    month: 'August',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 8000,
    paymentDate: '2026-08-05',
    paymentMethod: 'Bank Transfer',
    notes: 'Paid on time',
    status: 'Paid'
  },
  {
    id: 9,
    roomId: 1,
    month: 'September',
    year: 2026,
    rentAmount: 8000,
    paidAmount: 5000,
    paymentDate: '2026-09-10',
    paymentMethod: 'Cash',
    notes: 'Partial payment',
    status: 'Partial'
  },
  {
    id: 10,
    roomId: 2,
    month: 'September',
    year: 2026,
    rentAmount: 7000,
    paidAmount: 7000,
    paymentDate: '2026-09-01',
    paymentMethod: 'Bank Transfer',
    notes: 'Paid early',
    status: 'Paid'
  },
  {
    id: 11,
    roomId: 3,
    month: 'September',
    year: 2026,
    rentAmount: 7500,
    paidAmount: 0,
    paymentDate: '',
    paymentMethod: '',
    notes: 'Room vacant',
    status: 'Pending'
  },
  {
    id: 12,
    roomId: 4,
    month: 'September',
    year: 2026,
    rentAmount: 9000,
    paidAmount: 9000,
    paymentDate: '2026-09-05',
    paymentMethod: 'Cash',
    notes: 'First month rent',
    status: 'Paid'
  },
  {
    id: 13,
    roomId: 5,
    month: 'September',
    year: 2026,
    rentAmount: 8500,
    paidAmount: 4000,
    paymentDate: '2026-09-12',
    paymentMethod: 'Bank Transfer',
    notes: 'Will pay remaining next week',
    status: 'Partial'
  }
];

export const dummyElectricity = [
  {
    id: 1,
    roomId: 1,
    month: 'January',
    year: 2026,
    billDate: '2026-01-25',
    previousReading: 1000,
    currentReading: 1100,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 2,
    roomId: 1,
    month: 'February',
    year: 2026,
    billDate: '2026-02-25',
    previousReading: 1100,
    currentReading: 1220,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 3,
    roomId: 1,
    month: 'March',
    year: 2026,
    billDate: '2026-03-25',
    previousReading: 1220,
    currentReading: 1340,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 4,
    roomId: 1,
    month: 'April',
    year: 2026,
    billDate: '2026-04-25',
    previousReading: 1340,
    currentReading: 1460,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 5,
    roomId: 1,
    month: 'May',
    year: 2026,
    billDate: '2026-05-25',
    previousReading: 1460,
    currentReading: 1580,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 6,
    roomId: 1,
    month: 'June',
    year: 2026,
    billDate: '2026-06-25',
    previousReading: 1580,
    currentReading: 1720,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 7,
    roomId: 1,
    month: 'July',
    year: 2026,
    billDate: '2026-07-25',
    previousReading: 1720,
    currentReading: 1860,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 8,
    roomId: 1,
    month: 'August',
    year: 2026,
    billDate: '2026-08-25',
    previousReading: 1860,
    currentReading: 2000,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 9,
    roomId: 1,
    month: 'September',
    year: 2026,
    billDate: '2026-09-25',
    previousReading: 2000,
    currentReading: 2150,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 10,
    roomId: 2,
    month: 'September',
    year: 2026,
    billDate: '2026-09-25',
    previousReading: 1500,
    currentReading: 1620,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 11,
    roomId: 4,
    month: 'September',
    year: 2026,
    billDate: '2026-09-25',
    previousReading: 800,
    currentReading: 890,
    ratePerUnit: 8,
    otherCharges: 50
  },
  {
    id: 12,
    roomId: 5,
    month: 'September',
    year: 2026,
    billDate: '2026-09-25',
    previousReading: 1200,
    currentReading: 1330,
    ratePerUnit: 8,
    otherCharges: 50
  }
];

export const dummyExpenses = [
  {
    id: 1,
    roomId: 1,
    name: 'Plumbing Repair',
    category: 'Repair',
    amount: 500,
    date: '2026-09-10',
    notes: 'Fixed leak in bathroom'
  },
  {
    id: 2,
    roomId: 2,
    name: 'Water Tank Cleaning',
    category: 'Cleaning',
    amount: 300,
    date: '2026-09-15',
    notes: 'Annual cleaning'
  }
];

export const dummyDashboard = {
  totalProperties: 2,
  totalRooms: 5,
  expectedRent: 50000,
  collectedRent: 45000,
  pendingRent: 5000,
  electricityExpense: 8000,
  otherExpenses: 3000
};
