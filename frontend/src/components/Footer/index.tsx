import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";

import { useUiContext } from "../../contexts/UiContext";

const Copyright: React.FC = () => {
  const {
    value: { username },
  } = useUiContext();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
      <Typography variant="body2" color="textSecondary">
        {"Copyright © "}
        <Link color="inherit" href="#">
          Octank Systems Inc.
        </Link>{" "}
        {new Date().getFullYear()}
      </Typography>
      {username && (
        <Box mt={1}>
          <Typography variant="caption" color="textSecondary">
            Logged in as {username}
          </Typography>
        </Box>
      )}
      <Button href={process.env.REACT_APP_SIGN_IN_URL_ADMIN}>Admin</Button>
    </Box>
  );
};

const footers = [
  {
    title: "Company",
    description: ["Team", "History", "Contact us", "Locations"],
  },
  {
    title: "Features",
    description: [
      "Cool stuff",
      "Random feature",
      "Team feature",
      "Developer stuff",
      "Another one",
    ],
  },
  {
    title: "Resources",
    description: [
      "Resource",
      "Resource name",
      "Another resource",
      "Final resource",
    ],
  },
  {
    title: "Legal",
    description: ["Privacy policy", "Terms of use"],
  },
];

const Footer: React.FC = () => {
  const classes = useStyles();

  return (
    <Container maxWidth="md" component="footer" className={classes.footer}>
      <Grid container spacing={4} justify="space-evenly">
        {footers.map((footer) => (
          <Grid item xs={6} sm={3} key={footer.title}>
            <Typography variant="h6" color="textPrimary" gutterBottom>
              {footer.title}
            </Typography>
            <ul className={classes.list}>
              {footer.description.map((item) => (
                <li key={item}>
                  <Link href="#" variant="subtitle1" color="textSecondary">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </Grid>
        ))}
      </Grid>

      <Copyright />
    </Container>
  );
};

const useStyles = makeStyles(
  ({ palette, breakpoints, spacing, shape }: Theme) => ({
    footer: {
      borderTop: `1px solid ${palette.divider}`,
      marginTop: spacing(8),
      paddingTop: spacing(3),
      paddingBottom: spacing(3),
      [breakpoints.up("sm")]: {
        paddingTop: spacing(6),
        paddingBottom: spacing(6),
      },
    },
    list: {
      margin: 0,
      padding: 0,
      listStyle: "none",
    },
  })
);

export default Footer;
