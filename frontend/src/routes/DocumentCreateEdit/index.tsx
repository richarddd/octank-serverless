import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import LinearProgress from "@material-ui/core/LinearProgress";
import { makeStyles, Theme } from "@material-ui/core/styles";
import SvgIcon from "@material-ui/core/SvgIcon";
import TextField from "@material-ui/core/TextField";
import CloseIcon from "@material-ui/icons/Close";
import DownloadIcon from "@material-ui/icons/CloudDownload";
import UploadIcon from "@material-ui/icons/CloudUpload";
import EditIcon from "@material-ui/icons/Edit";
import axios, { AxiosRequestConfig } from "axios";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { useRouteMatch } from "react-router-dom";
import * as yup from "yup";

import documentsApi from "../../api/documents";
import DefaultContainer from "../../components/DefaultContainer";
import ErrorView from "../../components/ErrorView";
import Spinner from "../../components/Spinner";
import TitleToolBar from "../../components/TitleToolbar";
import usePromise from "../../hooks/usePromise";
import { formatBytes } from "../../utils";
import routes from "..";

const DocumentsCreate: React.FC = () => {
  const { params, path } = useRouteMatch();
  const [createState, create] = usePromise(documentsApi.create);
  const [updateState, update] = usePromise(documentsApi.update);
  const [urlState, getUrl] = usePromise(documentsApi.url);
  const [{ data: document, ...getState }, get] = usePromise(documentsApi.get);
  const [file, setFile] = useState<File | null>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<any | null>();
  const history = useHistory();
  const classes = useStyles();

  const { id } = params as { id?: string };

  const [editMode, setEditMode] = useState(!id);

  const uploadFile = async (file: File, url: string) => {
    const fileReader = new FileReader();
    await new Promise((resolve, reject) => {
      fileReader.readAsArrayBuffer(file);
      fileReader.onabort = reject;
      fileReader.onerror = reject;
      fileReader.onload = resolve;
    });

    const config: AxiosRequestConfig = {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(progress);
      },
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          file.name
        )}"`,
      },
    };
    await axios.put(url, fileReader.result, config);
  };

  const initialValues = useMemo(
    () => ({
      title: document?.title ?? "",
      description: document?.description ?? undefined,
      file: undefined as File | undefined,
    }),
    [document]
  );

  const validationSchema = useMemo(
    () =>
      yup.object({
        title: yup.string().required("Name is required"),
        ...((!id && { file: yup.string().required("File is required") }) || {}),
      }),
    [id]
  );

  const isImage = useMemo(
    () => document && document.contentType.startsWith("image/"),
    [document]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async ({ title, description }, { setSubmitting }) => {
      setSubmitting(true);

      try {
        let fileKey = null;
        if (file) {
          const { key, url } = await getUrl(file!.name);
          await uploadFile(file!, url);
          fileKey = key;
        }
        if (id && document) {
          await update(id, {
            key: fileKey || document.key,
            title,
            size: file?.size ?? document.size,
            description,
          });
        } else {
          await create({
            key: fileKey!,
            title,
            size: file!.size,
            description,
          });
        }

        history.push(routes.documents);
      } catch (e) {
        setProgress(null);
        setError(e);
        setSubmitting(false);
      }
    },
  });

  const { touched, setFieldValue } = formik;

  useEffect(() => {
    if (file && !touched.title) {
      setFieldValue("title", file!.name);
    }
  }, [file, setFieldValue, touched.title]);

  useEffect(() => {
    if (id) {
      get(id);
    }
  }, [get, id]);

  const loading = (id && getState.loading) || false;

  const handleDownloadClick = () => {
    if (document) {
      window.open(document.url, "_blank");
    }
  };
  const handleEditClick = () => {
    setEditMode((mode) => !mode);
  };

  return (
    <DefaultContainer>
      <TitleToolBar
        title={
          (loading && "...") ||
          (id &&
            document &&
            `${(editMode && "Edit ") || ""}${document.title}`) ||
          "Create new document"
        }
        parents={[[routes.documents, "Documents"]]}
      >
        {id && !loading && (
          <>
            <IconButton onClick={handleDownloadClick} color="inherit">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={handleEditClick} color="inherit">
              {(editMode && <CloseIcon />) || <EditIcon />}
            </IconButton>
          </>
        )}
      </TitleToolBar>
      {loading && <Spinner />}
      {document && !editMode && (
        <Card className={classes.details}>
          <Grid spacing={4} container>
            <Grid item>
              <Typography variant="caption">Title</Typography>
              <Typography variant="body1">{document.title}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">Size</Typography>
              <Typography variant="body1">
                {formatBytes(document.size)}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">Created</Typography>
              <Typography variant="body1">
                {new Date(document.createDate).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="caption">Updated</Typography>
              <Typography variant="body1">
                {new Date(document.updateDate).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption">Description</Typography>
              <Typography variant="body1">
                {document.description || "-"}
              </Typography>
            </Grid>
            {isImage && (
              <Grid item xs={12}>
                <Typography variant="caption">Image</Typography>
                <img src={document.previewUrl} width="100%" />
              </Grid>
            )}
            {document.contentType === "application/pdf" && (
              <Grid item xs={12}>
                <Typography variant="caption">Pdf</Typography>
                <iframe
                  style={{ minHeight: "100vh" }}
                  src={document.previewUrl}
                  width="100%"
                />
              </Grid>
            )}
          </Grid>
        </Card>
      )}
      {editMode && (
        <form onSubmit={formik.handleSubmit}>
          <InputLabel className={classes.input} htmlFor="import-button">
            <Input
              id="import-button"
              inputProps={{
                accept:
                  ".jpg, .png, .txt, .csv, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel",
              }}
              name="file"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFile((e.target.files || [null])[0]);
                return formik.handleChange(e);
              }}
              style={{
                display: "none",
              }}
              type="file"
            />
            <Button
              variant="contained"
              component="span"
              startIcon={
                <SvgIcon fontSize="small">
                  <UploadIcon />
                </SvgIcon>
              }
            >
              {file?.name ?? "Select file"}
            </Button>

            <FormHelperText
              error={formik.touched.file && Boolean(formik.errors.file)}
            >
              {formik.errors.file}
            </FormHelperText>
          </InputLabel>
          <TextField
            fullWidth
            className={classes.input}
            id="title"
            name="title"
            label="Title"
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
          <TextField
            fullWidth
            className={classes.input}
            id="description"
            name="description"
            multiline
            label="Description (optional)"
            value={formik.values.description}
            onChange={formik.handleChange}
            error={
              formik.touched.description && Boolean(formik.errors.description)
            }
            helperText={formik.touched.description && formik.errors.description}
          />
          {progress && (
            <LinearProgress variant="determinate" value={progress} />
          )}

          <Button
            disabled={formik.isSubmitting}
            className={classes.submit}
            color="primary"
            variant="contained"
            fullWidth
            type="submit"
          >
            Submit
          </Button>

          <ErrorView error={error || getState.error}>
            Something went wrong!
          </ErrorView>
        </form>
      )}
    </DefaultContainer>
  );
};

const useStyles = makeStyles(
  ({ palette, breakpoints, spacing, shape }: Theme) => ({
    input: {
      marginBottom: spacing(2),
    },
    submit: {
      marginTop: spacing(2),
    },
    details: {
      padding: spacing(4),
    },
  })
);

export default DocumentsCreate;
