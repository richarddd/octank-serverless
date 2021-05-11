import { useCallback } from "react";
import { useHistory } from "react-router-dom";

const useLinkClick = () => {
  const history = useHistory();

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e.preventDefault();
      const link = new URL(e.currentTarget.href);
      history.push(link.pathname);
    },
    [history]
  );

  return handleNavClick;
};

export default useLinkClick;
