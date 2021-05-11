import CssBaseline from "@material-ui/core/CssBaseline";
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Footer from "./components/Footer";
import Header from "./components/Header";
import UiContextProvider from "./contexts/UiContext";
import routes from "./routes";
import Admin from "./routes/Admin";
import Auth from "./routes/Auth";
import DocumentsCreate from "./routes/DocumentCreateEdit";
import Documents from "./routes/Documents";
import Home from "./routes/Home";
import NotFound from "./routes/NotFound";

const App: React.FC = () => {
  return (
    <>
      <CssBaseline />
      <Router>
        <UiContextProvider>
          <Header />
          <Switch>
            <Route exact path={routes.index}>
              <Home />
            </Route>
            <Route exact path={routes.documents}>
              <Documents />
            </Route>
            <Route exact path={routes.documentsNew}>
              <DocumentsCreate />
            </Route>
            <Route exact path={routes.documentsEdit}>
              <DocumentsCreate />
            </Route>
            <Route exact path={routes.admin}>
              <Admin />
            </Route>
            <Route exact path={routes.auth}>
              <Auth />
            </Route>
            <Route exact path={routes.logout}>
              <Auth />
            </Route>
            <Route exact path={routes.admin}>
              <Admin />
            </Route>
            <Route exact path="/*">
              <NotFound />
            </Route>
          </Switch>

          <Footer />
        </UiContextProvider>
      </Router>
    </>
  );
};

export default App;
