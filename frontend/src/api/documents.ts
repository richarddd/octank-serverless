import qs from "qs";

import request from "./request";

export type DocumentResponse = Readonly<DocumentRequest> & {
  readonly id: string;
  readonly createDate: string;
  readonly updateDate: string;
  readonly contentType: string;
};

export type UrlDocumentResponse = DocumentResponse & {
  readonly url: string;
  readonly previewUrl: string;
};

export type DocumentRequest = {
  key: string;
  title: string;
  description?: string;
  size: number;
};

export type DocumentUrlResponse = {
  readonly url: string;
  readonly key: string;
};

const documentsApi = {
  getAll: () => request.get<DocumentResponse[]>("/documents"),

  get: (id: string) => request.get<UrlDocumentResponse>(`/documents/${id}`),

  url: (type: string) =>
    request.get<DocumentUrlResponse>(
      `/documents/url?${qs.stringify({ type })}`
    ),

  create: (params: DocumentRequest) =>
    request.post<DocumentResponse>(`/documents/`, params),

  update: (id: string, params: DocumentRequest) =>
    request.post<DocumentResponse>(`/documents/${id}`, params),
};

export default documentsApi;
