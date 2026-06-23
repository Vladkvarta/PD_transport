import type {
  ArchiveTopic,
  Driver,
  RegistrationRequest,
} from "./types";

export const demoRequests: RegistrationRequest[] = [
  {
    id: "584291037",
    telegramUserId: "584291037",
    telegramChatId: "584291037",
    telegramUsername: "ivan_petrov",
    telegramFirstName: "Иван",
    telegramLastName: "Петров",
    status: "pending",
    messageCount: 2,
    lastSeenAt: { toDate: () => new Date() },
  },
  {
    id: "772406115",
    telegramUserId: "772406115",
    telegramChatId: "772406115",
    telegramUsername: null,
    telegramFirstName: "Сергей",
    telegramLastName: "Мороз",
    status: "pending",
    messageCount: 1,
    lastSeenAt: {
      toDate: () => new Date(Date.now() - 38 * 60 * 1000),
    },
  },
];

export const demoDrivers: Driver[] = [
  {
    id: "120034598",
    fullName: "Александр Коваленко",
    telegramUserId: "120034598",
    phone: "+380 67 123 45 67",
    department: "Администрация",
    vehicleLabel: "Toyota Camry",
    vehiclePlate: "AA 1427 KC",
    archiveTopicName: "Коваленко Александр",
    archiveThreadId: 47,
    notes: "",
    active: true,
  },
  {
    id: "902145337",
    fullName: "Николай Бондарь",
    telegramUserId: "902145337",
    phone: "+380 50 765 12 10",
    department: "Хозяйственный отдел",
    vehicleLabel: "Renault Master",
    vehiclePlate: "KA 8042 EX",
    archiveTopicName: "Бондарь Николай",
    archiveThreadId: 53,
    notes: "Резервный автомобиль по согласованию.",
    active: true,
  },
];

export const demoTopics: ArchiveTopic[] = [
  {
    id: "47",
    threadId: 47,
    name: "Коваленко Александр",
    groupTitle: "Архив маршрутных листов",
    active: true,
  },
  {
    id: "53",
    threadId: 53,
    name: "Бондарь Николай",
    groupTitle: "Архив маршрутных листов",
    active: true,
  },
  {
    id: "61",
    threadId: 61,
    name: "Резерв",
    groupTitle: "Архив маршрутных листов",
    active: true,
  },
];
