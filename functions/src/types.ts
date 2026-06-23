export type BotState =
  | { step: "idle" }
  | { step: "awaitingStartMileage" }
  | { step: "awaitingEndMileage"; shiftId: string }
  | {
      step: "awaitingDocument";
      shiftId: string;
      documentType: DocumentType;
    };

export type DocumentType =
  | "fuelReceipt"
  | "invoice"
  | "routeSheet"
  | "other";

export interface Driver {
  fullName: string;
  telegramUserId: string;
  vehicleLabel: string;
  vehiclePlate?: string;
  phone?: string;
  department?: string;
  notes?: string;
  archiveTopicName?: string;
  archiveThreadId: number;
  active: boolean;
  activeShiftId?: string;
  botState?: BotState;
}

export interface Shift {
  driverId: string;
  driverName: string;
  vehicleLabel: string;
  status: "active" | "completed";
  startMileage: number;
  endMileage?: number;
  distance?: number;
  startedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
}
