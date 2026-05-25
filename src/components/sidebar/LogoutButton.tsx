import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import ConfirmationModal from "@/components/shared/ConfirmationModal";

const LogoutButton = () => {
  const [showModal, setShowModal] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { status } = useSelector((state: RootState) => state.auth);
  const loading = status === "loading";

  const handleLogout = () => {
    dispatch(logoutUser(navigate));
    setShowModal(false);
  };

  return (
    <div className='mt-auto pt-4'>
      <button
        type='button'
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
        onClick={() => setShowModal(true)}
        disabled={loading}
      >
        {loading ? <Loader2 size={24} className="animate-spin" /> : <><LogOut size={24} /> Logout</>}
      </button>

      <ConfirmationModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        isLoading={loading}
        variant="danger"
      />
    </div>
  );
};
export default LogoutButton;
