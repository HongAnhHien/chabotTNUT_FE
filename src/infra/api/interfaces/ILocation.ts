import type { IPagination } from './IUser';

export interface IToadoDo {
  lat: number;
  lng: number;
}

export interface ILocationImage {
  url: string;
  caption?: string;
}

export interface ICreatedBy {
  _id: string;
  name: string;
  username: string;
}

export interface IChamDiemField {
  diem?: number | null;
  mo_ta?: string;
}

export interface IChamDiem {
  nguy_co?:  string;
  do_doc?:   IChamDiemField;
  taluy?:    IChamDiemField;
  lop_phu?:  IChamDiemField;
  loai_dat?: IChamDiemField;
}

export interface ILocation {
  _id:        string;
  ten_xa:     string;
  ten_huyen?: string;
  ten_tinh?:  string;
  toa_do:     IToadoDo;
  note?:      string;
  cham_diem?: IChamDiem;
  image_type?: 'single' | 'multi';
  images:     ILocationImage[];
  created_by?: ICreatedBy;
  createdAt:  string;
  updatedAt:  string;
}

export type ILocationDetail = ILocation;

export interface IMapLocation {
  _id:        string;
  ten_xa:     string;
  ten_huyen?: string;
  ten_tinh?:  string;
  toa_do:     IToadoDo;
  cham_diem?: IChamDiem;
  images:     ILocationImage[];
}

export interface IStatsByMucDo {
  muc_do: string;
  count:  number;
}

export interface IStatsByTinh {
  tinh:  string;
  count: number;
}

export interface ILocationStatistics {
  total:                number;
  by_muc_do_nguy_hiem:  IStatsByMucDo[];
  by_tinh:              IStatsByTinh[];
}

// API responses
export interface IGetLocationsResponse {
  success:   true;
  message:   string;
  data: {
    locations:  ILocation[];
    pagination: IPagination;
  };
}

export interface IGetLocationByIdResponse {
  success: true;
  message: string;
  data: { location: ILocationDetail };
}

export interface IGetStatisticsResponse {
  success: true;
  message: string;
  data: ILocationStatistics;
}

export interface IGetMapDataResponse {
  success: true;
  message: string;
  data: { locations: IMapLocation[] };
}

export interface ILocationMutationResponse {
  success: true;
  message: string;
  data: { location: ILocation };
}

export interface IDeleteLocationResponse {
  success: true;
  message: string;
}

export interface IDeleteManyLocationsResponse {
  success: true;
  message: string;
  data: { deletedCount: number };
}

// Create / Update
export interface ICreateLocationRequest {
  ten_xa:     string;
  ten_huyen?: string | null;
  ten_tinh?:  string | null;
  toa_do:     IToadoDo;
  note?:      string;
  cham_diem?: IChamDiem;
  captions?:  string[];
  images?:    File[];
}

export type IUpdateLocationRequest = Partial<ICreateLocationRequest> & {
  existing_images?: ILocationImage[];
};

export interface IGetLocationsParams {
  page?:             number;
  limit?:            number;
  id?:               string;
  ten_xa?:           string;
  created_by?:       string;
  muc_do_nguy_hiem?: string;
  from?:             string;
  to?:               string;
}

export interface IBackupParams {
  ids?:  string;
  from?: string;
  to?:   string;
}

export interface IImportResponse {
  success: true;
  message: string;
  data: { importedCount: number };
}
