import { SignInType } from "./jwt";

export const getLoginLogoutUrl = (
  loggedIn: boolean,
  type: SignInType = "user"
) => {
  const loginUrl = process.env[`REACT_APP_SIGN_IN_URL_${type.toUpperCase()}`]!;

  if (!loggedIn) {
    return loginUrl;
  }

  return loginUrl.replace(
    /login(.*)redirect_uri.*/,
    `logout$1logout_uri=${window.location.protocol}//${window.location.host}/logout`
  );
};

export const formatBytes = (bytes: number, decimals: number = 1) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};
