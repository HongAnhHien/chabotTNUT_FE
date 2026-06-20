import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  IGetLocationsParams,
  IGetLocationsResponse,
  IGetLocationByIdResponse,
  IGetStatisticsResponse,
  IGetMapDataResponse,
  ILocationMutationResponse,
  IDeleteLocationResponse,
  IDeleteManyLocationsResponse,
  IBackupParams,
  IImportResponse,
  ICreateLocationRequest,
  IUpdateLocationRequest,
} from '@/infra/api/interfaces/ILocation';

function buildFormData(data: ICreateLocationRequest | IUpdateLocationRequest): FormData {
  const form = new FormData();
  if (data.ten_xa)     form.append('ten_xa',     data.ten_xa);
  if (data.ten_huyen)  form.append('ten_huyen',  data.ten_huyen);
  if (data.ten_tinh)   form.append('ten_tinh',   data.ten_tinh);
  if (data.note !== undefined) form.append('note', data.note ?? '');
  if (data.toa_do)     form.append('toa_do',     JSON.stringify(data.toa_do));
  if (data.cham_diem)  form.append('cham_diem',  JSON.stringify(data.cham_diem));
  if (data.captions)   form.append('captions',   JSON.stringify(data.captions));
  if (data.images?.length) {
    data.images.forEach((file) => form.append('images', file));
  }
  if ('existing_images' in data && data.existing_images !== undefined) {
    form.append('existing_images', JSON.stringify(data.existing_images));
  }
  return form;
}

const LocationApi = {
  getStatistics: () =>
    axiosInstance.get<IGetStatisticsResponse>(API_ENDPOINTS.LOCATIONS.STATISTICS)
      .then((r) => r.data),

  getMapData: () =>
    axiosInstance.get<IGetMapDataResponse>(API_ENDPOINTS.LOCATIONS.MAP)
      .then((r) => r.data),

  getLocations: (params?: IGetLocationsParams) =>
    axiosInstance.get<IGetLocationsResponse>(API_ENDPOINTS.LOCATIONS.LIST, { params })
      .then((r) => r.data),

  getLocationById: (id: string) =>
    axiosInstance.get<IGetLocationByIdResponse>(API_ENDPOINTS.LOCATIONS.DETAIL(id))
      .then((r) => r.data),

  createLocation: (data: ICreateLocationRequest) =>
    axiosInstance.post<ILocationMutationResponse>(
      API_ENDPOINTS.LOCATIONS.CREATE,
      buildFormData(data),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data),

  updateLocation: (id: string, data: IUpdateLocationRequest) =>
    axiosInstance.put<ILocationMutationResponse>(
      API_ENDPOINTS.LOCATIONS.UPDATE(id),
      buildFormData(data),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data),

  deleteLocation: (id: string) =>
    axiosInstance.delete<IDeleteLocationResponse>(API_ENDPOINTS.LOCATIONS.DELETE(id))
      .then((r) => r.data),

  deleteManyLocations: (ids: string[]) =>
    axiosInstance.delete<IDeleteManyLocationsResponse>(API_ENDPOINTS.LOCATIONS.DELETE_MANY, {
      data: { ids },
    }).then((r) => r.data),

  backupLocations: (params?: IBackupParams) =>
    axiosInstance.get<Blob>(API_ENDPOINTS.LOCATIONS.BACKUP, {
      params,
      responseType: 'blob',
    }).then((r) => r.data),

  importLocations: (file: File) => {
    const form = new FormData();
    form.append('backup', file);
    return axiosInstance.post<IImportResponse>(
      API_ENDPOINTS.LOCATIONS.IMPORT,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data);
  },
};

export default LocationApi;
export type { IGetLocationsParams };
