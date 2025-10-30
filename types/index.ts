// Common types for the Planora application

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  destination: string;
  status: 'draft' | 'planned' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  rating?: number;
  description?: string;
}

export interface Itinerary {
  id: string;
  tripId: string;
  day: number;
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  placeId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  order: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  invite_token: string;
  invite_expires_at: string;
  created_at: string;
}

export interface UserGroup {
  user_id: string;
  group_id: string;
  joined_at: string;
}

