import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const useGetUsers = () => {
  const { users, status } = useSelector((state: RootState) => state.chat);
  const loading = status === "loading";

  return { loading, users };
};

export default useGetUsers;
