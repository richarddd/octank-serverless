import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import { DataGrid, GridColDef, GridRowParams } from "@material-ui/data-grid";
import React, { useEffect } from "react";
import { useHistory } from "react-router";

import documentsApi from "../../api/documents";
import DefaultContainer from "../../components/DefaultContainer";
import ErrorView from "../../components/ErrorView";
import Spinner from "../../components/Spinner";
import TitleToolBar from "../../components/TitleToolbar";
import useLinkClick from "../../hooks/useLinkClick";
import usePromise from "../../hooks/usePromise";
import { formatBytes } from "../../utils";
import routes from "..";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "title", headerName: "Title", flex: 1 },
  { field: "description", headerName: "Description", width: 130 },
  {
    field: "size",
    headerName: "Size",
    width: 100,
    valueFormatter: (params) => formatBytes(params.value as number),
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

const Documents: React.FC = () => {
  const [{ loading, data, error }, getAll] = usePromise(documentsApi.getAll);

  const history = useHistory();

  const handleLinkClick = useLinkClick();

  useEffect(() => {
    getAll();
  }, [getAll]);

  const handleOnRowClick = ({ id }: GridRowParams) => {
    history.push(`${routes.documents}/${id}`);
  };

  return (
    <DefaultContainer>
      <TitleToolBar title="Documents">
        <Button
          onClick={handleLinkClick}
          href={routes.documentsNew}
          variant="contained"
        >
          Create
        </Button>
      </TitleToolBar>
      {loading && <Spinner />}
      {data && (
        <Card>
          <DataGrid
            disableSelectionOnClick
            onRowClick={handleOnRowClick}
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

export default Documents;
