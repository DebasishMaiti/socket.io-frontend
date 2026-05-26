import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { loginChatUser } from "@/store/authSlice";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import PageSeo from "@/components/seo/PageSeo";
import AppLogo from "@/components/shared/AppLogo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status } = useSelector((state: RootState) => state.auth);
  const loading = status === "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    dispatch(loginChatUser({ email, password }, navigate));
  };

  return (
    <>
      <PageSeo
        title="Sign in"
        description="Sign in to NexTalk to message friends, join group chats, and start audio or video calls."
        path="/login"
      />
      <main className='flex flex-col items-center justify-center w-full max-w-md mx-auto p-4'>
      <AppLogo size="lg" className="mb-6 justify-center" />
      <div className='w-full p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20'>
        <h1 className='text-3xl font-bold text-center text-white mb-8'>
          Welcome <span className='text-blue-400'>Back</span>
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-1'>Email</label>
            <input
              type='email'
              placeholder='john@example.com'
              className='w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <label className='block text-sm font-medium text-gray-300 mb-1'>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder='••••••••'
              className='w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Link to='/signup' className='text-sm text-blue-400 hover:underline inline-block transition-all'>
            {"Don't"} have an account?
          </Link>

          <button
            className='w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2'
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Login</>}
          </button>
        </form>
      </div>
    </main>
    </>
  );
};
export default Login;
