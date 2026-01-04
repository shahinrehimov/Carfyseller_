export interface SupportMessage {
  id: number;
  user_type: string;
  user: {
    id: number;
    name: string;
    surname: string;
  };
  title: string;
  status: string;
  status_label: string;
  is_sent_to_admin: boolean;
  created_user: string;
  created_date: string;
}

export interface StatusOption {
  id: string;
  title: string;
}

export interface StatusHistory {
  id: number;
  status: string;
  status_label: string;
  created_user: string;
  created_date: string;
}

export interface SupportMessagesResponse {
  data: SupportMessage[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface StatusListResponse {
  data: StatusOption[];
}

export interface StatusHistoryResponse {
  data: StatusHistory[];
}

export interface ChangeStatusResponse {
  message: string;
  data: StatusHistory[];
}

export interface SupportMessageAnswer {
  id: number;
  answer: string;
  created_user: string;
  created_date: string;
}

export interface SupportMessageDetail {
  id: number;
  title: string;
  body: string;
  status: string;
  status_label: string;
  answers: SupportMessageAnswer[];
}

export interface SupportMessageDetailResponse {
  data: SupportMessageDetail;
}

export interface AddAnswerRequest {
  answer: string;
  status: string;
}

export interface AddAnswerResponse {
  message: string;
}
