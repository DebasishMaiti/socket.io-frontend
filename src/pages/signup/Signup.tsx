import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { signupChatUser } from "@/store/authSlice";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import PageSeo from "@/components/seo/PageSeo";
import AppLogo from "@/components/shared/AppLogo";

const SignUp = () => {
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status } = useSelector((state: RootState) => state.auth);
  const loading = status === "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.name || !inputs.email || !inputs.password || !inputs.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (inputs.password !== inputs.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    dispatch(signupChatUser(inputs, navigate));
  };

  return (
    <>
      <PageSeo
        title="Create account"
        description="Create a free NexTalk account for real-time messaging, group chats, voice notes, and calls."
        path="/signup"
      />
      <main className='flex flex-col items-center justify-center w-full max-w-md mx-auto p-4'>
      <AppLogo size="lg" className="mb-6 justify-center" />
      <div className='w-full p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20'>
        <h1 className='text-3xl font-bold text-center text-white mb-8'>
          Create <span className='text-blue-400'>Account</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-1'>Full Name</label>
            <input
              type='text'
              placeholder='John Doe'
              className='w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
              value={inputs.name}
              onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-1'>Email</label>
            <input
              type='email'
              placeholder='john@example.com'
              className='w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
              value={inputs.email}
              onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <label className='block text-sm font-medium text-gray-300 mb-1'>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder='••••••••'
              className='w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
              value={inputs.password}
              onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-1'>Confirm Password</label>
            <input
              type='password'
              placeholder='••••••••'
              className='w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
              value={inputs.confirmPassword}
              onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
            />
          </div>

          <Link to='/login' className='text-sm text-blue-400 hover:underline inline-block mt-2 transition-all'>
            Already have an account?
          </Link>

          <button
            className='w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2'
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Sign Up</>}
          </button>
        </form>
      </div>
    </main>
    </>
  );
};
export default SignUp;
