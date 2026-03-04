import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { useSettingsStore } from './store/settings';
import { useAuthStore } from './store/auth';
import { Maintenance } from './pages/Maintenance';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const PostList = lazy(() => import('./pages/PostList').then(m => ({ default: m.PostList })));
const PostDetail = lazy(() => import('./pages/PostDetail').then(m => ({ default: m.PostDetail })));
const CreatePost = lazy(() => import('./pages/CreatePost').then(m => ({ default: m.CreatePost })));
const EditPost = lazy(() => import('./pages/EditPost').then(m => ({ default: m.EditPost })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const EditProfile = lazy(() => import('./pages/EditProfile').then(m => ({ default: m.EditProfile })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Taskspace = lazy(() => import('./pages/Taskspace').then(m => ({ default: m.Taskspace })));
const PageDetail = lazy(() => import('./pages/PageDetail').then(m => ({ default: m.PageDetail })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const VideoList = lazy(() => import('./pages/VideoList').then(m => ({ default: m.VideoList })));
const CreateVideo = lazy(() => import('./pages/CreateVideo').then(m => ({ default: m.CreateVideo })));
const VideoDetail = lazy(() => import('./pages/VideoDetail').then(m => ({ default: m.VideoDetail })));
const EditVideo = lazy(() => import('./pages/EditVideo').then(m => ({ default: m.EditVideo })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const DirectMessage = lazy(() => import('./pages/DirectMessage'));
const GalleryList = lazy(() => import('./pages/GalleryList').then(m => ({ default: m.GalleryList })));
const CreateGallery = lazy(() => import('./pages/CreateGallery').then(m => ({ default: m.CreateGallery })));
const GalleryDetail = lazy(() => import('./pages/GalleryDetail').then(m => ({ default: m.GalleryDetail })));

function App() {
  const { settings, fetchSettings, isLoading } = useSettingsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  // 점검 모드 체크: 활성화되어 있고 사용자가 관리자/모더레이터가 아니면 점검 페이지 표시
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  if (settings.maintenance_mode === 'true' && !isAdmin) {
    return <Maintenance siteName={settings.site_name} />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/posts" element={<ProtectedRoute><PostList /></ProtectedRoute>} />
          <Route path="/posts/new" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/taskspace" element={<ProtectedRoute><Taskspace /></ProtectedRoute>} />
          <Route path="/taskspace/:id" element={<ProtectedRoute><PageDetail /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><VideoList /></ProtectedRoute>} />
          <Route path="/videos/new" element={<ProtectedRoute><CreateVideo /></ProtectedRoute>} />
          <Route path="/videos/:id" element={<ProtectedRoute><VideoDetail /></ProtectedRoute>} />
          <Route path="/videos/:id/edit" element={<ProtectedRoute><EditVideo /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/dm" element={<ProtectedRoute><DirectMessage /></ProtectedRoute>} />
          <Route path="/dm/:conversationId" element={<ProtectedRoute><DirectMessage /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><GalleryList /></ProtectedRoute>} />
          <Route path="/gallery/new" element={<ProtectedRoute><CreateGallery /></ProtectedRoute>} />
          <Route path="/gallery/:id" element={<ProtectedRoute><GalleryDetail /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
