const { getStackOutputValues, setEnv } = require("../setenv");
const outputValues = getStackOutputValues();

const setToLocalHost = (url, type) =>
  url.replace(/(redirect_uri=)(.*)/, `$1http://localhost:3000/auth/${type}`);

setEnv({
  REACT_APP_SIGN_IN_URL_USER: setToLocalHost(
    outputValues["SignInUrlUserOutput"],
    "user"
  ),
  REACT_APP_SIGN_IN_URL_ADMIN: setToLocalHost(
    outputValues["SignInUrlAdminOutput"],
    "admin"
  ),
});
