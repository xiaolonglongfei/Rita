import { Layout } from "@/components/layout";
import { useSignup, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowRight } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const signup = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate(
      { data: { name, email, password } },
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
      <div className="max-w-md mx-auto mt-16">
        <div className="text-center mb-8">
          <Activity className="mx-auto text-accent mb-4" size={48} />
          <h1 className="text-3xl font-black tracking-tighter">Join Rita</h1>
          <p className="text-muted-foreground mt-2 font-medium">Create an account to start reviewing.</p>
        </div>
        
        <div className="bg-card border rounded-2xl p-8 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-foreground">Full Name</label>
              <input 
                type="text" 
                className="w-full p-3 bg-background border rounded-lg font-medium focus:ring-2 focus:ring-accent outline-none transition-all" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-muted-foreground">Email Address</label>
              <input 
                type="email" 
                className="w-full p-3 bg-background border rounded-lg font-medium focus:ring-2 focus:ring-accent outline-none transition-all" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
                placeholder="Minimum 8 characters"
                required
              />
            </div>
            
            {signup.isError && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-bold">
                Registration failed. Email might be in use.
              </div>
            )}

            <button 
              type="submit" 
              disabled={signup.isPending}
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground p-4 rounded-lg font-black text-lg hover:bg-accent/90 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {signup.isPending ? "Creating Account..." : (
                <>Get Started <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-sm font-bold text-center text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </Layout>
  );
}
