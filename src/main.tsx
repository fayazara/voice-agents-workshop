import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Workshop } from "./workshop/Workshop.tsx";

function Router() {
  const [route, setRoute] = useState(() =>
    window.location.hash.startsWith("#/workshop") ? "workshop" : "app",
  );

  useEffect(() => {
    const handler = () => {
      setRoute(
        window.location.hash.startsWith("#/workshop") ? "workshop" : "app",
      );
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (route === "workshop") return <Workshop />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
