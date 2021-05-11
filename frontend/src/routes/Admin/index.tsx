import Card from "@material-ui/core/Card";
import { DataGrid, GridColDef } from "@material-ui/data-grid";
import React, { useEffect } from "react";

import adminApi from "../../api/admin";
import DefaultContainer from "../../components/DefaultContainer";
import ErrorView from "../../components/ErrorView";
import Spinner from "../../components/Spinner";
import TitleToolBar from "../../components/TitleToolbar";
import usePromise from "../../hooks/usePromise";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "username", headerName: "Username", flex: 1 },
  { field: "name", headerName: "Name", width: 130 },
  { field: "email", headerName: "Email", width: 130 },
  {
    field: "status",
    headerName: "Status",
    width: 100,
  },
  {
    field: "documentCount",
    headerName: "Documents",
    width: 70,
  },
  {
    field: "createDate",
    headerName: "Created",
    width: 180,
    valueFormatter: (params) =>
      new Date(params.value as string).toLocaleString(),
  },
  {
    field: "updateDate",
    headerName: "Updated",
    width: 180,
    valueFormatter: (params) =>
      new Date(params.value as string).toLocaleString(),
  },
];

const Admin: React.FC = () => {
  const [{ loading, data, error }, getAllUsers] = usePromise(
    adminApi.getAllUsers
  );

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  return (
    <DefaultContainer>
      <TitleToolBar title="Admin" />
      {loading && <Spinner />}
      {data && (
        <Card>
          <DataGrid
            disableSelectionOnClick
            autoHeight
            rows={data}
            columns={columns}
            pageSize={5}
          />
        </Card>
      )}
      <ErrorView error={error}>Something went wrong</ErrorView>
    </DefaultContainer>
  );
};

export default Admin;
