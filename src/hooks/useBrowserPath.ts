import { useEffect, useState } from "react";

export function useBrowserPath(defaultPath = "/") {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname || defaultPath,
  );

  useEffect(() => {
    if (window.location.pathname !== currentPath) {
      window.history.pushState(null, "", currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || defaultPath);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultPath]);

  return { currentPath, setCurrentPath };
}
