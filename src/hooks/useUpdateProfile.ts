import { useDispatch, useSelector } from "react-redux";
import { updateChatProfile } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";

const useUpdateProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { status } = useSelector((state: RootState) => state.auth);
  const loading = status === "loading";

  const updateProfile = async (data: { name: string, bio: string, profilePic?: File }) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("bio", data.bio);
    if (data.profilePic) {
      formData.append("profilePic", data.profilePic);
    }

    return await dispatch(updateChatProfile(formData));
  };

  return { updateProfile, loading };
};

export default useUpdateProfile;
