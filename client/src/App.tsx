import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Panel from "./pages/Panel";
import Verify from "./pages/Verify";

function Router() {
  return (
    <Switch>
      {/* Verificación: la raíz también recibe la respuesta de Discord (?code=…). */}
      <Route path={"/"} component={Verify} />
      <Route path={"/panel"} component={Panel} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-[#14131d] !border-white/15 !text-white !shadow-[0_10px_30px_rgba(0,0,0,.5)]",
                description: "!text-white/60",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;