import Container from "@material-ui/core/Container";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import clsx from "clsx";
import React from "react";

import heroBackground from "./hero.jpg";

const Home: React.FC = () => {
  const classes = useStyles();
  return (
    <div className={classes.heroWrapper}>
      <div
        className={clsx(classes.heroBackground, classes.heroBackgroundImage)}
      />
      <div
        className={clsx(classes.heroBackground, classes.heroBackgroundOverlay)}
      />
      <Container maxWidth="sm" component="main" className={classes.heroContent}>
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="textPrimary"
          gutterBottom
        >
          OccuDocs 2.0
        </Typography>
        <Typography
          variant="h5"
          align="center"
          color="textSecondary"
          component="p"
        >
          Octanks &quot;OccuDocs&quot; 2.0 Document Managment Systems is a
          completely revamped version.
        </Typography>
      </Container>
    </div>
  );
};

const useStyles = makeStyles(({ breakpoints, spacing, shape }: Theme) => ({
  heroContent: {
    padding: spacing(8, 0, 6),
    position: "relative",
    zIndex: 99,
    "& *": {
      color: "white",
    },
  },
  heroBackgroundImage: {
    backgroundImage: `url(${heroBackground})`,
    backgroundSize: "cover",
  },
  heroBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  heroBackgroundOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.5,
    backgroundColor: "black",
  },
  heroWrapper: {
    position: "relative",
  },
}));

export default Home;
