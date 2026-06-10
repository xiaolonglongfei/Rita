import { Layout } from "@/components/layout";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/");
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-20">
        <div className="text-center mb-8">
          <Activity className="mx-auto text-accent mb-4" size={48} />
          <h1 className="text-3xl font-black tracking-tighter">Welcome Back</h1>
          <p className="text-muted-foreground mt-2 font-medium">Log in to track your training sessions.</p>
        </div>
        
        <div className="bg-card border rounded-2xl p-8 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-foreground">Email Address</label>
              <input 
                type="email" 
                className="w-full p-3 bg-background border rounded-lg font-medium focus:ring-2 focus:ring-accent outline-none transition-all" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-foreground">Password</label>
              <input 
                type="password" 
                className="w-full p-3 bg-background border rounded-lg font-medium focus:ring-2 focus:ring-accent outline-none transition-all" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {login.isError && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-bold">
                Invalid credentials. Please try again.
              </div>
            )}

            <button 
              type="submit" 
              disabled={login.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground p-4 rounded-lg font-black text-lg hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {login.isPending ? "Authenticating..." : (
                <>Log In <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-sm font-bold text-center text-muted-foreground">
          Don't have an account? <Link href="/signup" className="text-accent hover:underline">Scout Instructors Now</Link>
        </p>
      </div>
    </Layout>
  );
}
