import React, { useCallback, useContext, useMemo, useState } from "react";

import jwt from "../jwt";

export const SIGN_IN_TYPE_KEY = "sign_in_type";

export type SignInType = "admin" | "user";

const defaultContextValue = {
  signedIn: (jwt.token && true) || false,
  signInType: localStorage.getItem(SIGN_IN_TYPE_KEY) as SignInType | null,
  username: jwt.username as string | null,
};

export type ContextType = typeof defaultContextValue;

const defaultValue = {
  value: defaultContextValue,
  // eslint-disable-next-line no-unused-vars
  setContext: (() => {}) as (newContext: Partial<ContextType>) => void,
};

export const UiContext = React.createContext(defaultValue);

const UiContextProvider: React.FC = ({ children }) => {
  const [state, setState] = useState(defaultContextValue);

  const setContext = useCallback(
    (newState: Partial<ContextType>) => {
      setState((oldState) => ({
        ...oldState,
        ...newState,
      }));
    },
    [setState]
  );

  const value = useMemo(
    () => ({
      value: state,
      setContext,
    }),
    [setContext, state]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export default UiContextProvider;

export const useUiContext = () => useContext(UiContext);
