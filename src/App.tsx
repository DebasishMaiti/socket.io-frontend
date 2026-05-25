import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "@/pages/home/Home";
import Login from "@/pages/login/Login";
import SignUp from "@/pages/signup/Signup";
import Profile from "@/pages/profile/Profile";
import { Toaster } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import useListenMessages from "@/hooks/useListenMessages";

function App() {
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  useListenMessages();

  return (
    <div className='p-0 md:p-4 h-[100dvh] flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black'>
      <div className="w-full h-full md:h-[95vh] md:max-w-6xl">
        <Routes>
          <Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
          <Route path='/profile' element={authUser ? <Profile /> : <Navigate to={"/login"} />} />
          <Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
          <Route path='/signup' element={authUser ? <Navigate to='/' /> : <SignUp />} />
        </Routes>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}

export default App;
