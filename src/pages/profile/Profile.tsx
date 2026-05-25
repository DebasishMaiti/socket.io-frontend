import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import useUpdateProfile from "@/hooks/useUpdateProfile";
import { Camera, ArrowLeft, Loader2, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import LogoutButton from "@/components/sidebar/LogoutButton";
import { baseUrl } from "@/shared/_services/api_service";

const Profile = () => {
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { updateProfile, loading } = useUpdateProfile();
  const [name, setName] = useState(authUser?.name || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, bio, profilePic: selectedFile || undefined });
  };

  const currentProfilePic = previewImage || (authUser?.profilePic && typeof authUser.profilePic === 'string'
    ? (authUser.profilePic.startsWith('http') || authUser.profilePic.startsWith('data:')
        ? authUser.profilePic 
        : `${baseUrl}${authUser.profilePic}`)
    : null);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex items-center gap-4">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30 bg-black/20">
              {currentProfilePic ? (
                <img src={currentProfilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <User size={64} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all group-hover:scale-110"
            >
              <Camera size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          <p className="mt-4 text-sm text-gray-400">Click the camera to change photo</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Your Name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-24"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Email (Cannot be changed)</label>
            <input
              type="email"
              value={authUser?.email}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
        </button>
      </form>

      <div className="px-8 pb-8">
        <div className="pt-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default Profile;
