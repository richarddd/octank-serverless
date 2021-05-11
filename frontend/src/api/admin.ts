import request from "./request";

export type UserResponse = {
  username: string;
  createDate: string;
  updateDate: string;
  name: string;
  status: string;
  id: string;
  email: string;
  enabled: string;
};

const adminApi = {
  getAllUsers: () => request.get<UserResponse[]>("/admin/users"),
};

export default adminApi;
