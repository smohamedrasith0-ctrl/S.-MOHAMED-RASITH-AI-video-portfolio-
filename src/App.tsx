/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Film,
  Upload,
  Trash2,
  Settings,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Instagram,
  CheckCircle,
  Play,
  RotateCcw,
  Edit3,
  Plus,
  Menu,
  X,
  ShieldCheck,
  User,
  Globe,
  Sparkles,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { GlowingBackground } from './components/GlowingBackground';

interface SettingsData {
  site_name: string;
  owner_name: string;
  owner_title: string;
  owner_bio: string;
  profile_photo: string;
  whatsapp: string;
  instagram: string;
  email: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  filename: string;
  thumbnail: string;
  duration: string;
  is_published: number;
  display_order: number;
  is_deleted: number;
  deleted_at: string | null;
  created_at: string;
}

export default function App() {
  const [settings, setSettings] = useState<SettingsData>({
    site_name: 'Nexus Portfolio',
    owner_name: 'Alex Morgan',
    owner_title: 'Senior Film Director & Creative Technologist',
    owner_bio: 'Crafting immersive visual stories, cinematic motion pictures, and high-performance digital experiences.',
    profile_photo: '',
    whatsapp: '+15550198',
    instagram: 'alexmorgan.studio',
    email: 'alex@morganstudio.dev'
  });

  const [videos, setVideos] = useState<Video[]>([]);
  const [adminVideos, setAdminVideos] = useState<Video[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [adminTab, setAdminTab] = useState<'overview' | 'sitename' | 'profile' | 'upload' | 'published' | 'trash' | 'social' | 'contact' | 'security'>('overview');
  
  // Selected video for modal player
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Admin form states
  const [siteNameInput, setSiteNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [ownerTitleInput, setOwnerTitleInput] = useState('');
  const [ownerBioInput, setOwnerBioInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [instagramInput, setInstagramInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', error: false });

  // Video upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadOrder, setUploadOrder] = useState('0');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadThumb, setUploadThumb] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Edit video modal state
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOrder, setEditOrder] = useState('0');
  const [editPublished, setEditPublished] = useState(1);
  const [editThumbFile, setEditThumbFile] = useState<File | null>(null);

  // Profile photo file state
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // Success feedback banner
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch settings & public videos on load
  useEffect(() => {
    fetchSettings();
    fetchPublicVideos();
    checkAdminSession();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      setSiteNameInput(data.site_name);
      setOwnerNameInput(data.owner_name);
      setOwnerTitleInput(data.owner_title);
      setOwnerBioInput(data.owner_bio);
      setWhatsappInput(data.whatsapp);
      setInstagramInput(data.instagram);
      setEmailInput(data.email);

      // Update document title
      document.title = `${data.site_name} — ${data.owner_name}`;
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  const fetchPublicVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error('Failed to fetch videos', e);
    }
  };

  const fetchAdminVideos = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminVideos(data);
      }
    } catch (e) {
      console.error('Failed to fetch admin videos', e);
    }
  };

  const checkAdminSession = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setIsAdminAuthenticated(true);
        fetchAdminVideos();
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsAdminAuthenticated(true);
        setIsAdminLoginOpen(false);
        setAdminPasswordInput('');
        setCurrentView('admin');
        fetchAdminVideos();
        showToast('Successfully logged in as Administrator');
      } else {
        setAdminLoginError(data.error || 'Login failed');
      }
    } catch (err) {
      setAdminLoginError('Network or server error during login');
    }
  };

  const handleAdminLogout = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}
    localStorage.removeItem('admin_token');
    setIsAdminAuthenticated(false);
    setCurrentView('public');
    showToast('Logged out successfully');
  };

  const handleSaveSettings = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    let payload: any = {};
    if (type === 'sitename') payload = { site_name: siteNameInput };
    if (type === 'profile') payload = { owner_name: ownerNameInput, owner_title: ownerTitleInput, owner_bio: ownerBioInput };
    if (type === 'social') payload = { whatsapp: whatsappInput, instagram: instagramInput };
    if (type === 'contact') payload = { email: emailInput };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        document.title = `${data.settings.site_name} — ${data.settings.owner_name}`;
        showToast('Settings updated successfully!');
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (e) {
      alert('Error updating settings');
    }
  };

  const handleProfilePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePhotoFile) return;
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('photo', profilePhotoFile);

    try {
      const res = await fetch('/api/admin/profile-photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(prev => ({ ...prev, profile_photo: data.profile_photo }));
        setProfilePhotoFile(null);
        showToast('Profile photograph updated successfully!');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (e) {
      alert('Error uploading photo');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match', error: true });
      return;
    }
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg({ text: 'Admin password changed successfully!', error: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password changed successfully');
      } else {
        setPasswordMsg({ text: data.error || 'Failed to change password', error: true });
      }
    } catch (e) {
      setPasswordMsg({ text: 'Network error', error: true });
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadMsg('Please select a video file.');
      return;
    }
    setIsUploading(true);
    setUploadMsg('Uploading video and generating assets...');

    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('video', uploadFile);
    if (uploadThumb) formData.append('thumbnail', uploadThumb);
    formData.append('title', uploadTitle || 'Untitled Project');
    formData.append('description', uploadDesc);
    formData.append('display_order', uploadOrder);
    formData.append('is_published', '1');

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadTitle('');
        setUploadDesc('');
        setUploadFile(null);
        setUploadThumb(null);
        setUploadMsg('Video uploaded & published successfully!');
        setIsUploading(false);
        fetchAdminVideos();
        fetchPublicVideos();
        showToast('Portfolio video uploaded successfully!');
        setAdminTab('published');
      } else {
        setUploadMsg(data.error || 'Upload failed');
        setIsUploading(false);
      }
    } catch (e) {
      setUploadMsg('Network error during upload');
      setIsUploading(false);
    }
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDesc);
    formData.append('display_order', editOrder);
    formData.append('is_published', editPublished.toString());
    if (editThumbFile) formData.append('thumbnail', editThumbFile);

    try {
      const res = await fetch(`/api/admin/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingVideo(null);
        setEditThumbFile(null);
        fetchAdminVideos();
        fetchPublicVideos();
        showToast('Project updated successfully');
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (e) {
      alert('Error updating video');
    }
  };

  const handleMoveToTrash = async (id: string) => {
    if (!confirm('Move this video to the Deleted Videos trash?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminVideos();
        fetchPublicVideos();
        showToast('Video moved to trash');
      }
    } catch (e) {}
  };

  const handleRestoreVideo = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/videos/${id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminVideos();
        fetchPublicVideos();
        showToast('Video restored successfully');
      }
    } catch (e) {}
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('WARNING: This will permanently delete the video file from server storage and remove all records. This action CANNOT be undone. Proceed?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/videos/${id}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminVideos();
        fetchPublicVideos();
        showToast('Video permanently deleted from storage');
      }
    } catch (e) {}
  };

  // Filtered admin video lists
  const publishedAdminVideos = adminVideos.filter(v => v.is_deleted === 0);
  const deletedVideos = adminVideos.filter(v => v.is_deleted === 1);
  const totalUploaded = adminVideos.length;
  const totalPublished = adminVideos.filter(v => v.is_published === 1 && v.is_deleted === 0).length;
  const totalDeleted = deletedVideos.length;

  return (
    <div className="min-h-screen bg-[#06020d] text-[#f4f4f5] font-sans antialiased selection:bg-purple-500 selection:text-black relative overflow-x-hidden">
      {/* Glowing Animated Background Image Layer */}
      <GlowingBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-purple-500 text-black px-5 py-3 rounded-xl font-medium shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating WhatsApp Contact Icon */}
      {settings.whatsapp && (
        <a
          href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out text-sm font-medium px-0 group-hover:px-2">
            WhatsApp
          </span>
        </a>
      )}

      {/* Top Navigation Bar adhering strictly to Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <a href="#" onClick={() => setCurrentView('public')} className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-purple-300 flex items-center justify-center text-black font-extrabold text-sm shadow-md">
              {settings.site_name.charAt(0)}
            </div>
            <span>{settings.site_name}</span>
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#portfolio" onClick={() => setCurrentView('public')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">Portfolio</a>
          <a href="#about" onClick={() => setCurrentView('public')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">About</a>
          <a href="#contact" onClick={() => setCurrentView('public')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">Contact</a>
          {isAdminAuthenticated && (
            <button
              onClick={() => setCurrentView(currentView === 'public' ? 'admin' : 'public')}
              className="text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap shrink-0 font-semibold"
            >
              {currentView === 'public' ? 'Admin Dashboard' : 'View Public Site'}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {isAdminAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView(currentView === 'public' ? 'admin' : 'public')}
                className="px-4 py-2 text-xs font-semibold text-black bg-purple-400 hover:bg-purple-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow"
              >
                {currentView === 'public' ? 'Dashboard' : 'Public Site'}
              </button>
              <button
                onClick={handleAdminLogout}
                className="px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'public' ? (
        <main>
          {/* Hero Section */}
          <section className="relative px-6 py-20 md:py-32 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold bg-purple-400/10 px-3 py-1.5 rounded-full border border-purple-400/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cinematic Portfolio & Direction</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white text-wrap leading-tight">
                Hi, I'm <span className="bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">{settings.owner_name}</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-zinc-300">
                {settings.owner_title}
              </p>
              <p className="text-base text-zinc-400 max-w-xl leading-relaxed">
                {settings.owner_bio}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#portfolio"
                  className="px-6 py-3 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-400/20 flex items-center gap-2"
                >
                  <span>Explore Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#contact"
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Get in Touch</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden border-2 border-zinc-700 shadow-2xl bg-zinc-900 group">
                {settings.profile_photo ? (
                  <img
                    src={settings.profile_photo}
                    alt={settings.owner_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500 p-6 text-center">
                    <User className="w-20 h-20 mb-3 text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-400">No profile photo uploaded</span>
                    <span className="text-xs text-zinc-600 mt-1">Admin can upload one in settings</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-xs text-purple-400 font-semibold tracking-wide uppercase">Portfolio Owner</span>
                </div>
              </div>
            </div>
          </section>

          {/* Portfolio Video Gallery Section */}
          <section id="portfolio" className="px-6 py-20 max-w-7xl mx-auto border-t border-zinc-800/80">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">Selected Works</h2>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Featured Portfolio Videos</h3>
              </div>
              <p className="text-sm text-zinc-400 max-w-md">
                Cinematic projects, commercials, and visual creations. Click any project to watch in high definition.
              </p>
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-24 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8 max-w-2xl mx-auto">
                <Film className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">No projects uploaded yet</h4>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  Stay tuned for upcoming creations. The administrator can upload new portfolio projects anytime through the Admin Dashboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map(video => (
                  <div
                    key={video.id}
                    onClick={() => setActiveVideo(video)}
                    className="group bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer shadow-lg flex flex-col"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-700">
                          <Film className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-purple-500/90 group-hover:bg-purple-400 text-black flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-110 transition-all duration-300">
                          <Play className="w-6 h-6 fill-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                          {video.title}
                        </h4>
                        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                          {video.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                        <span>Published Project</span>
                        <span className="text-purple-400 font-medium group-hover:underline">Watch Video →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* About Section */}
          <section id="about" className="px-6 py-20 max-w-7xl mx-auto border-t border-zinc-800/80">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">About The Director</h2>
                <h3 className="text-3xl font-bold tracking-tight text-white mb-6">Mastering the intersection of narrative film and modern digital art</h3>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  {settings.owner_bio}
                </p>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  With over a decade of experience producing award-winning commercials, branded documentaries, and interactive visual showcases, every project is engineered with meticulous attention to detail, lighting, pacing, and emotional resonance.
                </p>
                <div className="flex items-center gap-6 text-sm text-zinc-300">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">10+</div>
                    <div className="text-zinc-500 text-xs">Years Experience</div>
                  </div>
                  <div className="w-px h-8 bg-zinc-800"></div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{totalPublished}</div>
                    <div className="text-zinc-500 text-xs">Featured Projects</div>
                  </div>
                  <div className="w-px h-8 bg-zinc-800"></div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">Global</div>
                    <div className="text-zinc-500 text-xs">Clientele</div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl shadow-xl space-y-6">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span>Direct Communication Channels</span>
                </h4>
                <div className="space-y-4">
                  {settings.whatsapp && (
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-emerald-500" />
                        <div>
                          <div className="text-xs text-zinc-500">WhatsApp Direct</div>
                          <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{settings.whatsapp}</div>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">Open Chat →</span>
                    </a>
                  )}

                  {settings.instagram && (
                    <a
                      href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Instagram className="w-5 h-5 text-pink-500" />
                        <div>
                          <div className="text-xs text-zinc-500">Instagram Profile</div>
                          <div className="text-sm font-medium text-white group-hover:text-pink-400 transition-colors">@{settings.instagram.replace('@', '')}</div>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">View Profile →</span>
                    </a>
                  )}

                  {settings.email && (
                    <a
                      href={`mailto:${settings.email}`}
                      className="flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-xs text-zinc-500">Direct Business Email</div>
                          <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">{settings.email}</div>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">Send Mail →</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="px-6 py-20 max-w-4xl mx-auto border-t border-zinc-800/80 text-center">
            <h2 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">Let's Collaborate</h2>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Ready to bring your next vision to life?</h3>
            <p className="text-zinc-400 max-w-xl mx-auto mb-8">
              Reach out directly via email or WhatsApp to discuss your upcoming project, commission, or creative direction.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {settings.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="px-8 py-4 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2.5"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email: {settings.email}</span>
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl border border-zinc-700 transition-all flex items-center gap-2.5"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>WhatsApp Chat</span>
                </a>
              )}
            </div>
          </section>
        </main>
      ) : (
        /* Admin Dashboard View */
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8">
          {/* Admin Sidebar Navigation */}
          <aside className="w-full lg:w-72 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shrink-0 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-purple-400 text-black font-bold flex items-center justify-center text-lg shadow">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Admin Control</h3>
                  <p className="text-xs text-zinc-400">Secure Management Panel</p>
                </div>
              </div>

              <nav className="space-y-1.5">
                {[
                  { id: 'overview', label: 'Dashboard Overview', icon: Sparkles },
                  { id: 'sitename', label: 'Website Name Settings', icon: Globe },
                  { id: 'profile', label: 'Profile Management', icon: User },
                  { id: 'upload', label: 'Upload New Video', icon: Upload },
                  { id: 'published', label: 'Published Videos', icon: Film },
                  { id: 'trash', label: 'Deleted Videos / Trash', icon: Trash2, count: deletedVideos.length },
                  { id: 'social', label: 'Social Media Settings', icon: MessageCircle },
                  { id: 'contact', label: 'Contact Information', icon: Mail },
                  { id: 'security', label: 'Security & Password', icon: Lock },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = adminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminTab(item.id as any)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? 'bg-purple-400 text-black font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-black text-purple-400' : 'bg-red-500/20 text-red-400'}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <button
                onClick={() => setCurrentView('public')}
                className="w-full mb-3 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors text-center"
              >
                View Public Website
              </button>
              <button
                onClick={handleAdminLogout}
                className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* Admin Content Panel */}
          <div className="flex-grow bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10 shadow-xl">
            {adminTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
                  <p className="text-sm text-zinc-400">Welcome to your secure admin control center. Here is your website summary.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Total Uploaded Videos</div>
                    <div className="text-3xl font-extrabold text-white">{totalUploaded}</div>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Published Videos</div>
                    <div className="text-3xl font-extrabold text-purple-400">{totalPublished}</div>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Deleted / Trash</div>
                    <div className="text-3xl font-extrabold text-red-400">{totalDeleted}</div>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs font-medium uppercase mb-1">Profile Photo Status</div>
                    <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>{settings.profile_photo ? 'Active & Configured' : 'Default / Not Set'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <span>System & Security Status</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between p-3 bg-zinc-900 rounded-xl">
                      <span className="text-zinc-400">Website Name:</span>
                      <span className="text-white font-semibold">{settings.site_name}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-zinc-900 rounded-xl">
                      <span className="text-zinc-400">Owner Name:</span>
                      <span className="text-white font-semibold">{settings.owner_name}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-zinc-900 rounded-xl">
                      <span className="text-zinc-400">Authentication:</span>
                      <span className="text-emerald-400 font-semibold">Secure Server Session (Argon2/Bcrypt)</span>
                    </div>
                    <div className="flex justify-between p-3 bg-zinc-900 rounded-xl">
                      <span className="text-zinc-400">Storage Engine:</span>
                      <span className="text-purple-400 font-semibold">Local File Storage & SQLite</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'sitename' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Website Name Settings</h2>
                  <p className="text-sm text-zinc-400">Customize your website name. Changes automatically reflect across the entire site and browser title.</p>
                </div>

                <form onSubmit={e => handleSaveSettings(e, 'sitename')} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Website Name</label>
                    <input
                      type="text"
                      value={siteNameInput}
                      onChange={e => setSiteNameInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow"
                  >
                    Save Website Name
                  </button>
                </form>
              </div>
            )}

            {adminTab === 'profile' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Portfolio Owner Profile Management</h2>
                  <p className="text-sm text-zinc-400">Update your photograph, professional title, biography, and owner name.</p>
                </div>

                <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase">Profile Photograph</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                      {settings.profile_photo ? (
                        <img src={settings.profile_photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-8 h-8 text-zinc-600" />
                      )}
                    </div>
                    <form onSubmit={handleProfilePhotoUpload} className="flex-grow space-y-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => setProfilePhotoFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-purple-400 hover:file:bg-zinc-700 cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={!profilePhotoFile}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium disabled:opacity-50 transition-all"
                      >
                        Upload & Replace Photograph
                      </button>
                    </form>
                  </div>
                </div>

                <form onSubmit={e => handleSaveSettings(e, 'profile')} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Owner Name</label>
                    <input
                      type="text"
                      value={ownerNameInput}
                      onChange={e => setOwnerNameInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Professional Title</label>
                    <input
                      type="text"
                      value={ownerTitleInput}
                      onChange={e => setOwnerTitleInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Short Biography</label>
                    <textarea
                      rows={4}
                      value={ownerBioInput}
                      onChange={e => setOwnerBioInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow"
                  >
                    Save Profile Information
                  </button>
                </form>
              </div>
            )}

            {adminTab === 'upload' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upload New Portfolio Video</h2>
                  <p className="text-sm text-zinc-400">Upload MP4 or WebM video files with custom thumbnail and project details.</p>
                </div>

                <form onSubmit={handleVideoUpload} className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Project Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Neon Horizon Cinematic Teaser"
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Project Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the production, creative vision, and technologies used..."
                      value={uploadDesc}
                      onChange={e => setUploadDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Video File (MP4, WebM)</label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-purple-400 hover:file:bg-zinc-700 cursor-pointer"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Custom Thumbnail Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => setUploadThumb(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-purple-400 hover:file:bg-zinc-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Display Order (Sort Index)</label>
                    <input
                      type="number"
                      value={uploadOrder}
                      onChange={e => setUploadOrder(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {uploadMsg && (
                    <div className={`p-4 rounded-xl text-sm ${isUploading ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {uploadMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-8 py-3.5 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading Video...' : 'Upload & Publish Project'}</span>
                  </button>
                </form>
              </div>
            )}

            {adminTab === 'published' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Published & Active Videos</h2>
                  <p className="text-sm text-zinc-400">Manage uploaded portfolio projects, edit details, toggle publication, or move to trash.</p>
                </div>

                {publishedAdminVideos.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-950 rounded-2xl border border-zinc-800 p-6">
                    <Film className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-sm">No videos found. Upload your first project in the Upload section.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publishedAdminVideos.map(video => (
                      <div key={video.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="w-28 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-zinc-800">
                            {video.thumbnail ? (
                              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700"><Film className="w-6 h-6" /></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">{video.title}</h4>
                            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{video.description || 'No description'}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                              <span>Order: {video.display_order}</span>
                              <span>·</span>
                              <span className={video.is_published ? 'text-emerald-400 font-medium' : 'text-purple-400 font-medium'}>
                                {video.is_published ? 'Published' : 'Unpublished'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => {
                              setEditingVideo(video);
                              setEditTitle(video.title);
                              setEditDesc(video.description);
                              setEditOrder(video.display_order.toString());
                              setEditPublished(video.is_published);
                            }}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleMoveToTrash(video.id)}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminTab === 'trash' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Deleted Videos / Trash</h2>
                  <p className="text-sm text-zinc-400">Restored videos return to the public portfolio. Permanently deleted videos are completely removed from server storage.</p>
                </div>

                {deletedVideos.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-950 rounded-2xl border border-zinc-800 p-6">
                    <Trash2 className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-sm">Trash bin is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deletedVideos.map(video => (
                      <div key={video.id} className="p-4 bg-zinc-950 border border-red-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="w-28 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-zinc-800 opacity-60">
                            {video.thumbnail ? (
                              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700"><Film className="w-6 h-6" /></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-300 text-base">{video.title}</h4>
                            <p className="text-xs text-red-400/80 mt-0.5">Deleted on: {video.deleted_at || 'Unknown'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => handleRestoreVideo(video.id)}
                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(video.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Permanently Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminTab === 'social' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Social Media Settings</h2>
                  <p className="text-sm text-zinc-400">Manage WhatsApp number and Instagram handle dynamically displayed across the website.</p>
                </div>

                <form onSubmit={e => handleSaveSettings(e, 'social')} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">WhatsApp Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +15550198"
                      value={whatsappInput}
                      onChange={e => setWhatsappInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Used for floating WhatsApp contact icon and direct chat button.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Instagram Username / Handle</label>
                    <input
                      type="text"
                      placeholder="e.g. alexmorgan.studio"
                      value={instagramInput}
                      onChange={e => setInstagramInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow"
                  >
                    Save Social Media Settings
                  </button>
                </form>
              </div>
            )}

            {adminTab === 'contact' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Contact Information Settings</h2>
                  <p className="text-sm text-zinc-400">Update business email address for client inquiries and mailto contact links.</p>
                </div>

                <form onSubmit={e => handleSaveSettings(e, 'contact')} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Business Email Address</label>
                    <input
                      type="email"
                      placeholder="alex@morganstudio.dev"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow"
                  >
                    Save Contact Information
                  </button>
                </form>
              </div>
            )}

            {adminTab === 'security' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Security & Password Settings</h2>
                  <p className="text-sm text-zinc-400">Change your secure admin control password. Passwords are hashed using bcrypt.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">New Password (Min 6 chars)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                      required
                    />
                  </div>

                  {passwordMsg.text && (
                    <div className={`p-4 rounded-xl text-sm ${passwordMsg.error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow"
                  >
                    Update Admin Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 px-6 py-12 mt-20 bg-[#09090b]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <div>
            © {new Date().getFullYear()} {settings.site_name} ({settings.owner_name}). All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#portfolio" onClick={() => setCurrentView('public')} className="hover:text-zinc-300 transition-colors">Portfolio</a>
            <a href="#about" onClick={() => setCurrentView('public')} className="hover:text-zinc-300 transition-colors">About</a>
            <a href="#contact" onClick={() => setCurrentView('public')} className="hover:text-zinc-300 transition-colors">Contact</a>
            {!isAdminAuthenticated && (
              <button onClick={() => setIsAdminLoginOpen(true)} className="hover:text-purple-400 transition-colors">
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAdminLoginOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-400 text-black rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Admin Authentication</h3>
              <p className="text-xs text-zinc-400 mt-1">Enter your secure administrator password (default: <span className="text-purple-400 font-mono">admin123</span>)</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Admin Password</label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  required
                  autoFocus
                />
              </div>

              {adminLoginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-400 hover:bg-purple-300 text-black font-semibold rounded-xl transition-all shadow"
              >
                Access Admin Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-lg">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideo.filename}
                controls
                autoPlay
                className="w-full h-full max-h-[70vh] object-contain"
              />
            </div>

            <div className="p-6 bg-zinc-900 border-t border-zinc-800">
              <p className="text-zinc-300 text-sm leading-relaxed">{activeVideo.description || 'No description provided.'}</p>
              <div className="mt-4 text-xs text-zinc-500">
                Uploaded: {new Date(activeVideo.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingVideo(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Edit Portfolio Project</h3>

            <form onSubmit={handleUpdateVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Project Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Project Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Display Order</label>
                  <input
                    type="number"
                    value={editOrder}
                    onChange={e => setEditOrder(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Publication Status</label>
                  <select
                    value={editPublished}
                    onChange={e => setEditPublished(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value={1}>Published</option>
                    <option value={0}>Unpublished</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Replace Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => setEditThumbFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-purple-400 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-400 hover:bg-purple-300 text-black rounded-xl text-sm font-semibold shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
