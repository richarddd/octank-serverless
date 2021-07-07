import Container from "@material-ui/core/Container";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import clsx from "clsx";
import React from "react";
import Hero from "../../components/Hero";

import heroBackground from "./hero.jpg";

const Home: React.FC = () => {
  return (
    <main>
      <Hero background={heroBackground}>
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
      </Hero>
    </main>
  );
};

export default Home;
