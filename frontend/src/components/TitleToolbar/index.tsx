import Box from "@material-ui/core/Box";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link from "@material-ui/core/Link";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import React from "react";

import useLinkClick from "../../hooks/useLinkClick";

type Props = {
  title: string;
  parents?: [string, string][];
};

const TitleToolBar: React.FC<Props> = ({ title, children, parents }) => {
  const classes = useStyles();

  const handleLinkClick = useLinkClick();

  return (
    <Box mt={2} mb={2}>
      {parents && parents.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb">
          {parents.map(([url, label]) => (
            <Link
              key={label}
              color="inherit"
              href={url}
              onClick={handleLinkClick}
            >
              {label}
            </Link>
          ))}
          <Typography color="textPrimary">{title}</Typography>
        </Breadcrumbs>
      )}
      <Toolbar className={classes.toolbar}>
        <Typography variant="h3">{title}</Typography>
        <Box flexGrow={1} />
        {children}
      </Toolbar>
    </Box>
  );
};

const useStyles = makeStyles(
  ({ palette, breakpoints, spacing, shape }: Theme) => ({
    toolbar: {
      padding: 0,
    },
  })
);

export default TitleToolBar;
