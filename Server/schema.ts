import { readFileSync } from 'node:fs';

import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';
import { DateTimeResolver, JSONObjectResolver } from 'graphql-scalars';
import { withFilter } from 'graphql-subscriptions';
import mongoose from 'mongoose';

import { demo } from './demo.js';
import { Notifications, type Notification } from './model.js';
import { updates } from './notices.js';

export interface Context {
  owner: string | null;
}

export const typeDefs = readFileSync(new URL('./schema.graphql', import.meta.url), 'utf8');

function ownerOf(context: Context): string {
  if (!context.owner) {
    throw new GraphQLError('Unauthenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  return context.owner;
}

const resolvers = {
  DateTime: DateTimeResolver,
  JSONObject: JSONObjectResolver,
  NotificationLevel: { NEUTRAL: 'neutral', CONFIRM: 'confirm', ERROR: 'error', INFO: 'info', WARNING: 'warning' },
  Notification: {
    id: (notification: Notification) => String(notification._id),
  },
  Query: {
    notifications: async (_: unknown, __: unknown, context: Context) =>
      Notifications.find({ ownerGUID: ownerOf(context), dismissedAt: null }).sort({ updatedAt: -1 }).lean(),
  },
  Mutation: {
    notificationsDismiss: async (_: unknown, { ids }: { ids: string[] }, context: Context) => {
      const owner = ownerOf(context);
      const valid = ids.filter((id) => mongoose.isValidObjectId(id));
      const found = await Notifications.find(
        { _id: { $in: valid }, ownerGUID: owner, dismissedAt: null },
        { _id: 1 },
      ).lean();
      const dismissed = found.map(({ _id }) => _id);

      await Notifications.updateMany({ _id: { $in: dismissed } }, { $set: { dismissedAt: new Date() } });

      return dismissed.map(String);
    },
    notificationsDemo: async (_: unknown, __: unknown, context: Context) => {
      await demo(ownerOf(context));
      return true;
    },
  },
  Subscription: {
    notificationsUpdated: {
      subscribe: withFilter(
        () => updates.asyncIterableIterator('UPDATED'),
        (payload, _, context?: Context) =>
          Boolean(context?.owner) && payload?.notificationsUpdated.ownerGUID === context?.owner,
      ),
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
