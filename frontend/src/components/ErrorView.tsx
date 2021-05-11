import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useHistory } from "react-router-dom";

import routes from "../routes";
import DefaultContainer from "./DefaultContainer";

type Props = {
  contained?: boolean;
  error: any;
};

const ErrorView: React.FC<Props> = ({ children, contained = false, error }) => {
  const history = useHistory();

  if (!error) {
    return null;
  }

  const authError = error?.response?.status === 401;

  const handleOkClick = () => {
    history.replace(routes.logout);
  };

  const content = (
    <Box mt={2}>
      {authError && (
        <Dialog open={authError}>
          <DialogTitle>Unauthnorized</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have been signed out. Click ok to return to start page
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleOkClick} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {contained && <Typography variant="h4">Error</Typography>}
      <Typography color="error" variant="body1">
        {children}
      </Typography>
    </Box>
  );

  return (
    (contained && <DefaultContainer>{content}</DefaultContainer>) || content
  );
};

export default ErrorView;
