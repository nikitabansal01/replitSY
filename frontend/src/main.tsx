import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const queryClient = new QueryClient();

const root = createRoot(rootElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);
