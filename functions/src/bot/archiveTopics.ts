import { FieldValue } from "firebase-admin/firestore";
import type { Context } from "telegraf";
import { archiveChatId } from "../config.js";
import { db } from "../firebase.js";

type ForumMessage = {
  message_thread_id?: number;
  forum_topic_created?: {
    name: string;
    icon_color: number;
    icon_custom_emoji_id?: string;
  };
  forum_topic_edited?: {
    name?: string;
    icon_custom_emoji_id?: string;
  };
  forum_topic_closed?: Record<string, never>;
  forum_topic_reopened?: Record<string, never>;
};

export async function captureArchiveTopic(ctx: Context): Promise<void> {
  const chat = ctx.chat;
  if (
    !chat
    || chat.type !== "supergroup"
    || chat.id.toString() !== archiveChatId.value()
  ) {
    return;
  }

  await db.collection("appSettings").doc("telegramArchive").set({
    chatId: chat.id.toString(),
    title: chat.title,
    isForum: "is_forum" in chat ? chat.is_forum === true : false,
    lastSeenAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const message = (ctx.message ?? ctx.editedMessage) as
    | ForumMessage
    | undefined;
  const threadId = message?.message_thread_id;
  if (!threadId) {
    return;
  }

  const topicRef = db.collection("archiveTopics").doc(threadId.toString());
  const current = await topicRef.get();
  const created = message.forum_topic_created;
  const edited = message.forum_topic_edited;
  const currentName = current.data()?.name as string | undefined;
  const name = created?.name
    ?? edited?.name
    ?? currentName
    ?? `Тема ${threadId}`;

  await topicRef.set({
    chatId: chat.id.toString(),
    threadId,
    name,
    groupTitle: chat.title,
    iconColor: created?.icon_color ?? current.data()?.iconColor ?? null,
    iconCustomEmojiId: created?.icon_custom_emoji_id
      ?? edited?.icon_custom_emoji_id
      ?? current.data()?.iconCustomEmojiId
      ?? null,
    active: message.forum_topic_closed ? false : true,
    source: created ? "created" : "observed",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (message.forum_topic_reopened) {
    await topicRef.update({ active: true });
  }
}

