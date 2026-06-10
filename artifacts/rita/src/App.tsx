import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Instructors from "@/pages/instructors";
import InstructorProfile from "@/pages/instructor-profile";
import Sessions from "@/pages/sessions";
import NewSession from "@/pages/new-session";
import NewReview from "@/pages/new-review";
import Rankings from "@/pages/rankings";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/instructors" component={Instructors} />
      <Route path="/instructors/:id" component={InstructorProfile} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/sessions/new" component={NewSession} />
      <Route path="/reviews/new" component={NewReview} />
      <Route path="/rankings" component={Rankings} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
