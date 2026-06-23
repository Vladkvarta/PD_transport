import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { archiveChatId, telegramBotToken } from "./config.js";
import { db } from "./firebase.js";

interface CreateTopicResponse {
  ok: boolean;
  result?: {
    message_thread_id: number;
    name: string;
    icon_color: number;
    icon_custom_emoji_id?: string;
  };
  description?: string;
}

interface GetChatResponse {
  ok: boolean;
  result?: {
    id: number;
    title?: string;
    type: string;
    is_forum?: boolean;
  };
  description?: string;
}

export const createArchiveTopic = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    secrets: [telegramBotToken],
  },
  async (request) => {
    const role = request.auth?.token.role;
    if (role !== "secretary" && role !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only staff members can create archive topics.",
      );
    }

    const name = typeof request.data?.name === "string"
      ? request.data.name.trim()
      : "";
    if (name.length < 1 || name.length > 128) {
      throw new HttpsError(
        "invalid-argument",
        "Topic name must contain between 1 and 128 characters.",
      );
    }

    const chatResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken.value()}/getChat`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: archiveChatId.value() }),
      },
    );
    const chatResult = await chatResponse.json() as GetChatResponse;
    if (
      !chatResponse.ok
      || !chatResult.ok
      || !chatResult.result
      || chatResult.result.type !== "supergroup"
      || chatResult.result.is_forum !== true
    ) {
      throw new HttpsError(
        "failed-precondition",
        chatResult.description
          ?? "The configured archive chat is not a forum supergroup.",
      );
    }

    await db.collection("appSettings").doc("telegramArchive").set({
      chatId: chatResult.result.id.toString(),
      title: chatResult.result.title ?? "Telegram archive",
      isForum: true,
      lastSeenAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken.value()}/createForumTopic`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: archiveChatId.value(),
          name,
        }),
      },
    );
    const result = await response.json() as CreateTopicResponse;
    if (!response.ok || !result.ok || !result.result) {
      throw new HttpsError(
        "failed-precondition",
        result.description ?? "Telegram could not create the topic.",
      );
    }

    const topic = result.result;
    await db.collection("archiveTopics")
      .doc(topic.message_thread_id.toString())
      .set({
        chatId: archiveChatId.value(),
        groupTitle: chatResult.result.title ?? "Telegram archive",
        threadId: topic.message_thread_id,
        name: topic.name,
        iconColor: topic.icon_color,
        iconCustomEmojiId: topic.icon_custom_emoji_id ?? null,
        active: true,
        source: "panel",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

    return {
      threadId: topic.message_thread_id,
      name: topic.name,
    };
  },
);
