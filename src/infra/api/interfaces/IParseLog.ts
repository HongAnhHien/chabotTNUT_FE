export type ParseLogService = 'llama' | 'word' | 'excel';
export type ParseLogStatus  = 'success' | 'error';

export interface IParseLog {
  _id:             string;
  subject_file_id: string;
  ma_mon:          string;
  filename:        string;
  file_size:       number;
  service:         ParseLogService;
  status:          ParseLogStatus;
  duration_ms:     number;
  job_id:          string | null;
  error:           string | null;
  preview:         string | null;
  created_at:      string;
}

export interface IParseLogsQuery {
  status?:   ParseLogStatus;
  service?:  ParseLogService;
  ma_mon?:   string;
  filename?: string;
  per_page?: number;
  page?:     number;
}

export interface IParseLogsMeta {
  total:        number;
  per_page:     number;
  current_page: number;
  last_page:    number;
}

export interface IParseLogsResponse {
  success: boolean;
  data:    IParseLog[];
  meta:    IParseLogsMeta;
}

export interface IParseLogStatsByService {
  service:      ParseLogService;
  total:        number;
  success:      number;
  error:        number;
  avg_duration: number;
}

export interface IParseLogRecentError {
  filename:   string;
  ma_mon:     string;
  service:    ParseLogService;
  error:      string;
  created_at: string;
}

export interface IParseLogStats {
  total:         number;
  success:       number;
  error:         number;
  success_rate:  number;
  by_service:    IParseLogStatsByService[];
  recent_errors: IParseLogRecentError[];
}

export interface IParseLogStatsResponse {
  success: boolean;
  data:    IParseLogStats;
}
