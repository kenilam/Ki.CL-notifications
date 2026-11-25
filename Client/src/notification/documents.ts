import { gql, type TypedDocumentNode } from '@apollo/client';

type Level = 'NEUTRAL' | 'CONFIRM' | 'ERROR' | 'INFO' | 'WARNING';

interface Text {
  key: string;
  values: Record<string, unknown>;
}

interface Notice {
  __typename: 'Notification';
  id: string;
  source: string;
  path: string;
  level: Level;
  running: boolean;
  namespace: string;
  title: Text;
  message: Text;
  dismissedAt: string | null;
  updatedAt: string;
}

const FIELDS = `
  id
  source
  path
  level
  running
  namespace
  title { key values }
  message { key values }
  dismissedAt
  updatedAt
`;

const NotificationsDocument: TypedDocumentNode<{ notifications: Notice[] }> = gql`
  query kicl_notifications {
    notifications { ${FIELDS} }
  }
`;

const NotificationsDismissDocument: TypedDocumentNode<{ notificationsDismiss: string[] }, { ids: string[] }> = gql`
  mutation kicl_notificationsDismiss($ids: [ID!]!) {
    notificationsDismiss(ids: $ids)
  }
`;

const NotificationsDemoDocument: TypedDocumentNode<{ notificationsDemo: boolean }> = gql`
  mutation kicl_notificationsDemo {
    notificationsDemo
  }
`;

const NotificationsUpdatedDocument: TypedDocumentNode<{ notificationsUpdated: Notice }> = gql`
  subscription kicl_notificationsUpdated {
    notificationsUpdated { ${FIELDS} }
  }
`;

export {
  NotificationsDemoDocument,
  NotificationsDismissDocument,
  NotificationsDocument,
  NotificationsUpdatedDocument,
  type Level,
  type Notice,
};
