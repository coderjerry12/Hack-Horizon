import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, UserCircle } from "@phosphor-icons/react";

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";
      // We assumevite proxy is not yet set up, so we will use full URL or assume /api
      const payload = isLogin ? { email: formData.email, username: formData.username, password: formData.password } : formData;
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("accessToken", data.data.accessToken || data.data.user?.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken || data.data.user?.refreshToken);
        if (!isLogin) {
          navigate("/login");
          setIsLogin(true);
        } else {
          if (!data.data.user.isSetupComplete) {
            navigate("/setup-account");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        alert(data.message || "An error occurred");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#fdfbf7] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-[440px] bg-white rounded-[2rem] p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/50"
      >
        <div className="bg-zinc-50 rounded-[calc(2rem-0.5rem)] p-8">
          <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center text-white">
              <UserCircle weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {isLogin ? "Enter your details to proceed" : "Start your medical profile today"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-700">Username</label>
                <input 
                  type="text" 
                  required 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                  placeholder="johndoe"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Email</label>
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                placeholder="hello@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Password</label>
              <input 
                type="password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button 
              disabled={loading}
              className="mt-4 group relative px-6 py-3.5 rounded-full bg-zinc-950 text-white font-medium text-sm tracking-wide active:scale-[0.98] transition-transform w-full flex items-center justify-center gap-2 overflow-hidden shadow-xl shadow-zinc-950/10 disabled:opacity-50"
            >
              <span>{loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}</span>
              {!loading && (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px] absolute right-4">
                  <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-zinc-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button onClick={() => setIsLogin(!isLogin)} type="button" className="ml-1 text-zinc-950 font-medium hover:underline">
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
