import * as pubsub from '@google-cloud/pubsub';

import { apply, type Notice } from './notices.js';

const TOPIC = process.env.NOTIFICATIONS_TOPIC;

let topic: pubsub.Topic | undefined;

/** Sends a notice the way any other service does. Without a topic, as in local work, it is applied here. */
export async function publish(notice: Notice): Promise<void> {
  if (!TOPIC) {
    await apply(notice);
    return;
  }

  topic ??= new pubsub.PubSub().topic(TOPIC);
  await topic.publishMessage({ json: notice });
}
