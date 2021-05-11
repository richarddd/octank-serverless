import Container from "@material-ui/core/Container";
import React from "react";

const DefaultContainer: React.FC = ({ children }) => {
  return (
    <Container maxWidth="md" component="main">
      {children as any}
    </Container>
  );
};

export default DefaultContainer;
