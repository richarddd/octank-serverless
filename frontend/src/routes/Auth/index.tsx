import Box from "@material-ui/core/Box";
import qs from "qs";
import React, { useEffect } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";

import DefaultContainer from "../../components/DefaultContainer";
import ErrorView from "../../components/ErrorView";
import { useUiContext } from "../../contexts/UiContext";
import jwt from "../../jwt";
import routes from "..";

const Auth: React.FC = () => {
  const { params, path } = useRouteMatch();

  const isLogout = path === routes.logout;

  const { setContext } = useUiContext();
  const history = useHistory();

  const signInType = (params as any)["0"];

  const { access_token: accessToken } = qs.parse(window.location.hash || "");

  useEffect(() => {
    if (signInType && accessToken) {
      jwt.signInType = signInType;
      jwt.token = accessToken as string;
      setContext({
        signInType,
        signedIn: true,
        username: jwt.username,
      });

      history.replace(routes.index);
    }
  }, [accessToken, history, setContext, signInType]);

  useEffect(() => {
    if (isLogout) {
      setContext({
        signInType: null,
        signedIn: false,
        username: undefined,
      });
      jwt.clear();
      history.replace(routes.index);
    }
  }, [history, isLogout, setContext]);

  if (!isLogout && (!signInType || !accessToken)) {
    return (
      <ErrorView error={true} contained>
        Invalid auth
      </ErrorView>
    );
  }

  return (
    <DefaultContainer>
      <Box mt={2}>
        {(isLogout && "Logout") || "Login"} successul, redirecting...
      </Box>
    </DefaultContainer>
  );
};

export default Auth;
