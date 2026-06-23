export interface RegistrationRequest {
  id: string;
  telegramUserId: string;
  telegramChatId: string;
  telegramUsername: string | null;
  telegramFirstName: string;
  telegramLastName: string | null;
  status: "pending" | "approved";
  messageCount: number;
  createdAt?: { toDate(): Date };
  lastSeenAt?: { toDate(): Date };
}

export interface Driver {
  id: string;
  fullName: string;
  telegramUserId: string;
  phone: string;
  department: string;
  vehicleLabel: string;
  vehiclePlate: string;
  archiveTopicName: string;
  archiveThreadId: number;
  notes: string;
  active: boolean;
  activeShiftId?: string;
}

export type DriverDraft = Omit<Driver, "id">;

export interface ArchiveTopic {
  id: string;
  threadId: number;
  name: string;
  groupTitle?: string;
  active: boolean;
}

export interface Shift {
  id: string;
  driverId: string;
  driverName: string;
  vehicleLabel: string;
  status: "active" | "completed";
  startMileage: number;
  endMileage?: number;
  distance?: number;
  startedAt: any;
  completedAt?: any;
}

export interface TelegramArchiveSettings {
  chatId: string;
  title: string;
  isForum: boolean;
}
