import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import { makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";
import React from "react";

type Props = {
  background: string;
};

const Hero: React.FC<Props> = ({ children, background }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div
        className={clsx(classes.heroBackground, classes.heroBackgroundImage)}
        style={{
          backgroundImage: `url(${background})`,
        }}
      />
      <div
        className={clsx(classes.heroBackground, classes.heroBackgroundOverlay)}
      />
      <Container maxWidth="sm" component="div" className={classes.heroContent}>
        {children as any}
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
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroBackgroundImage: {
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
  root: {
    position: "relative",
    display: "flex",
    height: "50vh",
  },
}));

export default Hero;
