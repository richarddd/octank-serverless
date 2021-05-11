import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import React from "react";

import { useUiContext } from "../../contexts/UiContext";
import useLinkClick from "../../hooks/useLinkClick";
import routes from "../../routes";
import { getLoginLogoutUrl } from "../../utils";
import logo from "./logo.svg";

const Header: React.FC = () => {
  const classes = useStyles();

  const handleNavClick = useLinkClick();

  const {
    value: { signedIn, signInType },
  } = useUiContext();

  return (
    <AppBar position="static" color="default">
      <Toolbar className={classes.toolbar}>
        <Button
          onClick={handleNavClick}
          href={routes.index}
          className={classes.logoButton}
        >
          <img className={classes.logo} src={logo} alt="Logo" />
          Octank
        </Button>
        <Box display="flex" flexGrow={1} />
        <nav>
          {signedIn &&
            ((signInType === "user" && (
              <Button onClick={handleNavClick} href={routes.documents}>
                Documents
              </Button>
            )) || (
              <Button onClick={handleNavClick} href={routes.admin}>
                Admin
              </Button>
            ))}
          <Button onClick={handleNavClick} href={routes.support}>
            Support
          </Button>
        </nav>
        <Button
          href={getLoginLogoutUrl(signedIn, signInType || undefined)}
          color="primary"
          variant="outlined"
          className={classes.link}
        >
          {(signedIn && "Logout") || "Login"}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

const useStyles = makeStyles(({ breakpoints, spacing, shape }: Theme) => ({
  toolbar: {
    flexDirection: "column",
    paddingLeft: 0,
    [breakpoints.up("sm")]: {
      flexWrap: "wrap",
      flexDirection: "row",
    },
  },
  logoButton: {
    height: spacing(8),
    padding: spacing(0, 3),
    fontSize: spacing(2.5),
    fontWeight: 600,
  },
  link: {
    margin: spacing(1, 1.5),
  },
  logo: {
    marginRight: spacing(1),
    height: spacing(4),
  },
}));

export default Header;
