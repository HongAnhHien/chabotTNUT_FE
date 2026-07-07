export type NotificationType =
  | 'assignment_assigned'
  | 'assignment_reminder'
  | 'assignment_due_soon'
  | 'exam_schedule_reminder'
  | 'assignment_due_soon_teacher';

export interface INotification {
  id:           string;
  username:     string;
  type:         NotificationType;
  title:        string;
  body:         string;
  data:         Record<string, unknown>;
  reference_id?: string;
  read_at:      string | null;
  created_at:   string;
  updated_at?:  string;
}

export interface INotificationsQuery {
  unread_only?: boolean;
  per_page?:    number;
  page?:        number;
}

export interface INotificationsMeta {
  total:        number;
  per_page:     number;
  current_page: number;
  last_page:    number;
}

export interface INotificationsResponse {
  success:      boolean;
  unread_count: number;
  data:         INotification[];
  meta:         INotificationsMeta;
}

export interface IMarkNotificationReadResponse {
  success: boolean;
  message: string;
}

export interface IMarkAllNotificationsReadResponse {
  success: boolean;
  message: string;
  data:    { marked_count: number };
}
