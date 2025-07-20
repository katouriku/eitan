"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserProfilePicture from '@/components/UserProfilePicture';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Student {
  id?: string;
  name: string;
  age: number | string;
  grade_level: string;
  english_ability: string;
  notes: string;
}

interface Lesson {
  id: string;
  date: string;
  duration: number;
  participants: number;
  lesson_type: 'online' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [fullNameKana, setFullNameKana] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'students' | 'lessons'>('profile');
  const [newStudent, setNewStudent] = useState<Student>({
    name: '',
    age: '',
    grade_level: '',
    english_ability: '',
    notes: ''
  });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const supabase = createClientComponentClient();

  const loadUserProfileAndStudents = useCallback(async () => {
    if (!user) return;

    try {
      // Load user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        // Override with database values if they exist
        setFullName(profileData.full_name || user.user_metadata?.full_name || '');
        setFullNameKana(profileData.full_name_kana || user.user_metadata?.full_name_kana || '');
        setPreferredLocation(profileData.preferred_location || user.user_metadata?.preferred_location || '');
      }

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true });

      if (studentsError) {
        console.error('Error loading students:', studentsError);
      } else {
        setStudents(studentsData || []);
      }

      // Load lessons (bookings)
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_email', user.email)
        .order('date', { ascending: false });

      if (lessonsError) {
        console.error('Error loading lessons:', lessonsError);
      } else {
        // Transform booking data to lesson format
        const transformedLessons: Lesson[] = (lessonsData || []).map((booking) => {
          const bookingDate = new Date(booking.date);
          const now = new Date();
          let status: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
          
          if (bookingDate < now) {
            status = 'completed';
          }
          
          return {
            id: booking.id,
            date: booking.date,
            duration: booking.duration,
            participants: booking.participants,
            lesson_type: booking.lesson_type,
            status,
            created_at: booking.created_at
          };
        });
        setLessons(transformedLessons);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    
    // Load user profile data from metadata and from database
    setFullName(user.user_metadata?.full_name || '');
    setFullNameKana(user.user_metadata?.full_name_kana || '');
    setPreferredLocation(user.user_metadata?.preferred_location || '');
    
    // Load user profile and students from database
    loadUserProfileAndStudents();
  }, [user, router, loadUserProfileAndStudents]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setShowProfileSuccess(false);

    try {
      // First, upsert to user_profiles table in the database
      const { error: dbError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: fullName,
            full_name_kana: fullNameKana,
            preferred_location: preferredLocation,
          },
          { onConflict: 'user_id' }
        );

      if (dbError) {
        throw new Error('Failed to update profile in database');
      }

      // Also update user metadata as backup
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          full_name_kana: fullNameKana,
          preferred_location: preferredLocation
        }
      });

      if (authError) {
        console.warn('Failed to update user metadata:', authError);
        // Don't throw here since database update succeeded
      }

      setShowProfileSuccess(true);
      // Hide the checkmark after 3 seconds
      setTimeout(() => setShowProfileSuccess(false), 3000);
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('パスワードは6文字以上である必要があります。');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません。');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('パスワードが正常に更新されました。');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。');
      console.error('Password update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Student management functions
  const addStudent = async () => {
    if (!user || !newStudent.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          parent_id: user.id,
          name: newStudent.name.trim(),
          age: parseInt(newStudent.age.toString()),
          grade_level: newStudent.grade_level,
          english_ability: newStudent.english_ability,
          notes: newStudent.notes.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setStudents([...students, data]);
      setNewStudent({
        name: '',
        age: '',
        grade_level: '',
        english_ability: '',
        notes: ''
      });
      setShowStudentForm(false);
    } catch (err) {
      console.error('Error adding student:', err);
      alert('生徒の追加に失敗しました。');
    }
  };

  const updateStudent = async (studentId: string, updatedStudent: Student) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: updatedStudent.name.trim(),
          age: parseInt(updatedStudent.age.toString()),
          grade_level: updatedStudent.grade_level,
          english_ability: updatedStudent.english_ability,
          notes: updatedStudent.notes.trim()
        })
        .eq('id', studentId)
        .eq('parent_id', user.id);

      if (error) throw error;

      setStudents(students.map(s => 
        s.id === studentId ? { ...updatedStudent, id: studentId } : s
      ));
      setEditingStudent(null);
    } catch (err) {
      console.error('Error updating student:', err);
      alert('生徒情報の更新に失敗しました。');
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!user || !confirm('この生徒を削除してもよろしいですか？')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('parent_id', user.id);

      if (error) throw error;

      setStudents(students.filter(s => s.id !== studentId));
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('生徒の削除に失敗しました。');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3881ff] mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">認証を確認しています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3881ff] to-[#5a9eff] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserProfilePicture size="lg" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {user.user_metadata?.full_name || 'ユーザー'}
                  </h1>
                  <p className="opacity-90">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ログアウト
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-[var(--border)]">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-[#3881ff] border-b-2 border-[#3881ff]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  プロフィール
                </div>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'text-[#3881ff] border-b-2 border-[#3881ff]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  セキュリティ
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'students'
                    ? 'text-[#3881ff] border-b-2 border-[#3881ff]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  生徒管理
                </div>
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'lessons'
                    ? 'text-[#3881ff] border-b-2 border-[#3881ff]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  レッスン履歴
                </div>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Messages */}
            {error && (
              <div className="mb-6 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {message && !showProfileSuccess && (
              <div className="mb-6 p-3 rounded-xl text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                {message}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                    基本情報
                  </h2>
                  
                  <div className="grid gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        メールアドレス
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 mb-2 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                      />
                      <p className="text-xs text-[var(--muted-foreground)]">
                        メールアドレスは変更できません
                      </p>
                    </div>

                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        氏名
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                        placeholder="山田 太郎"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="fullNameKana" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        氏名（ひらがな）
                      </label>
                      <input
                        id="fullNameKana"
                        type="text"
                        value={fullNameKana}
                        onChange={(e) => setFullNameKana(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                        placeholder="やまだ たろう"
                      />
                    </div>

                    <div>
                      <label htmlFor="preferredLocation" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        希望レッスン場所
                      </label>
                      <input
                        id="preferredLocation"
                        type="text"
                        value={preferredLocation}
                        onChange={(e) => setPreferredLocation(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                        placeholder="例: 東京都渋谷区渋谷1-1-1 または オンライン"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-[#3881ff] to-[#5a9eff] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '更新中...' : 'プロフィールを更新'}
                    </button>
                    
                    {showProfileSuccess && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in duration-300">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">更新完了</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                    パスワード変更
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        新しいパスワード
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                        placeholder="6文字以上"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        パスワード確認
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#3881ff] focus:border-[#3881ff] transition-all duration-300"
                        placeholder="新しいパスワードをもう一度入力"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'パスワード変更中...' : 'パスワードを変更'}
                  </button>
                </form>
              </div>
            )}

            {/* Students Tab Content */}
            {activeTab === 'students' && (
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">生徒管理</h2>
                  <p className="text-[var(--muted-foreground)]">お子様の情報を管理できます。</p>
                </div>

                {/* Add New Student Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowStudentForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3881ff] text-white rounded-lg hover:bg-[#3881ff]/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    生徒を追加
                  </button>
                </div>

                {/* New Student Form */}
                {showStudentForm && (
                  <div className="mb-8 p-6 border border-[var(--border)] rounded-xl bg-[var(--card)]">
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">新しい生徒を追加</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          お名前 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[#3881ff] focus:border-transparent"
                          placeholder="生徒のお名前"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          年齢
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="18"
                          value={newStudent.age}
                          onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                          className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[#3881ff] focus:border-transparent"
                          placeholder="年齢"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          学年
                        </label>
                        <select
                          value={newStudent.grade_level}
                          onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                          className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[#3881ff] focus:border-transparent"
                        >
                          <option value="">選択してください</option>
                          <option value="未就学児">未就学児</option>
                          <option value="小学1年">小学1年</option>
                          <option value="小学2年">小学2年</option>
                          <option value="小学3年">小学3年</option>
                          <option value="小学4年">小学4年</option>
                          <option value="小学5年">小学5年</option>
                          <option value="小学6年">小学6年</option>
                          <option value="中学1年">中学1年</option>
                          <option value="中学2年">中学2年</option>
                          <option value="中学3年">中学3年</option>
                          <option value="高校1年">高校1年</option>
                          <option value="高校2年">高校2年</option>
                          <option value="高校3年">高校3年</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          英語レベル
                        </label>
                        <select
                          value={newStudent.english_ability}
                          onChange={(e) => setNewStudent({ ...newStudent, english_ability: e.target.value })}
                          className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[#3881ff] focus:border-transparent"
                        >
                          <option value="">選択してください</option>
                          <option value="初心者">初心者</option>
                          <option value="初級">初級</option>
                          <option value="中級">中級</option>
                          <option value="上級">上級</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        備考
                      </label>
                      <textarea
                        value={newStudent.notes}
                        onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[#3881ff] focus:border-transparent"
                        placeholder="特記事項、好きなもの、苦手なものなど"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={addStudent}
                        disabled={!newStudent.name.trim()}
                        className="px-4 py-2 bg-[#3881ff] text-white rounded-lg hover:bg-[#3881ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        追加
                      </button>
                      <button
                        onClick={() => {
                          setShowStudentForm(false);
                          setNewStudent({
                            name: '',
                            age: '',
                            grade_level: '',
                            english_ability: '',
                            notes: ''
                          });
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                {/* Students List */}
                <div className="space-y-4">
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-[var(--muted-foreground)]">
                      まだ生徒が登録されていません。
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="p-6 border border-[var(--border)] rounded-xl bg-[var(--card)]">
                        {editingStudent?.id === student.id ? (
                          // Edit form
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                お名前
                              </label>
                              <input
                                type="text"
                                value={editingStudent.name}
                                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                年齢
                              </label>
                              <input
                                type="number"
                                value={editingStudent.age}
                                onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                学年
                              </label>
                              <select
                                value={editingStudent.grade_level}
                                onChange={(e) => setEditingStudent({ ...editingStudent, grade_level: e.target.value })}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                              >
                                <option value="">選択してください</option>
                                <option value="未就学児">未就学児</option>
                                <option value="小学1年">小学1年</option>
                                <option value="小学2年">小学2年</option>
                                <option value="小学3年">小学3年</option>
                                <option value="小学4年">小学4年</option>
                                <option value="小学5年">小学5年</option>
                                <option value="小学6年">小学6年</option>
                                <option value="中学1年">中学1年</option>
                                <option value="中学2年">中学2年</option>
                                <option value="中学3年">中学3年</option>
                                <option value="高校1年">高校1年</option>
                                <option value="高校2年">高校2年</option>
                                <option value="高校3年">高校3年</option>
                                <option value="その他">その他</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                英語レベル
                              </label>
                              <select
                                value={editingStudent.english_ability}
                                onChange={(e) => setEditingStudent({ ...editingStudent, english_ability: e.target.value })}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                              >
                                <option value="">選択してください</option>
                                <option value="初心者">初心者</option>
                                <option value="初級">初級</option>
                                <option value="中級">中級</option>
                                <option value="上級">上級</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                備考
                              </label>
                              <textarea
                                value={editingStudent.notes}
                                onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                              />
                            </div>
                            <div className="md:col-span-2 flex gap-3">
                              <button
                                onClick={() => updateStudent(student.id!, editingStudent)}
                                className="px-4 py-2 bg-[#3881ff] text-white rounded-lg hover:bg-[#3881ff]/90 transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingStudent(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display view
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-semibold text-[var(--foreground)]">{student.name}</h3>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingStudent(student)}
                                  className="p-2 text-gray-500 hover:text-[#3881ff] transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteStudent(student.id!)}
                                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-[var(--muted-foreground)]">年齢:</span>
                                <span className="ml-2 text-[var(--foreground)]">{student.age}歳</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">学年:</span>
                                <span className="ml-2 text-[var(--foreground)]">{student.grade_level || '未設定'}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">英語レベル:</span>
                                <span className="ml-2 text-[var(--foreground)]">{student.english_ability || '未設定'}</span>
                              </div>
                            </div>
                            {student.notes && (
                              <div className="mt-4">
                                <span className="text-[var(--muted-foreground)] text-sm">備考:</span>
                                <p className="mt-1 text-[var(--foreground)] text-sm">{student.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Lessons Tab Content */}
            {activeTab === 'lessons' && (
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">レッスン履歴</h2>
                  <p className="text-[var(--muted-foreground)]">過去と今後のレッスンを確認できます。</p>
                </div>

                {/* Lessons List */}
                <div className="space-y-6">
                  {lessons.length === 0 ? (
                    <div className="text-center py-12 text-[var(--muted-foreground)]">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg mb-2">まだレッスンの予約がありません</p>
                      <p className="text-sm">初回レッスンを予約してみましょう！</p>
                    </div>
                  ) : (
                    <>
                      {/* Upcoming Lessons */}
                      {lessons.some(lesson => lesson.status === 'upcoming') && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            今後の予定
                          </h3>
                          <div className="grid gap-4">
                            {lessons.filter(lesson => lesson.status === 'upcoming').map((lesson) => (
                              <div key={lesson.id} className="p-6 border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-lg font-semibold text-[var(--foreground)]">
                                      {lesson.lesson_type === 'online' ? 'オンライン' : '対面'}レッスン
                                    </h4>
                                  </div>
                                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                                    予約済み
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">日時:</span>
                                    <p className="font-medium text-[var(--foreground)]">
                                      {new Date(lesson.date).toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'short'
                                      })}
                                    </p>
                                    <p className="text-[var(--foreground)]">
                                      {new Date(lesson.date).toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">時間:</span>
                                    <p className="font-medium text-[var(--foreground)]">{lesson.duration}分</p>
                                  </div>
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">参加者数:</span>
                                    <p className="font-medium text-[var(--foreground)]">{lesson.participants}名</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Past Lessons */}
                      {lessons.some(lesson => lesson.status === 'completed') && (
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            過去のレッスン
                          </h3>
                          <div className="grid gap-4">
                            {lessons.filter(lesson => lesson.status === 'completed').map((lesson) => (
                              <div key={lesson.id} className="p-6 border border-[var(--border)] rounded-xl bg-[var(--card)]">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <h4 className="text-lg font-semibold text-[var(--foreground)]">
                                      {lesson.lesson_type === 'online' ? 'オンライン' : '対面'}レッスン
                                    </h4>
                                  </div>
                                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                                    完了
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">日時:</span>
                                    <p className="font-medium text-[var(--foreground)]">
                                      {new Date(lesson.date).toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'short'
                                      })}
                                    </p>
                                    <p className="text-[var(--foreground)]">
                                      {new Date(lesson.date).toLocaleTimeString('ja-JP', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">時間:</span>
                                    <p className="font-medium text-[var(--foreground)]">{lesson.duration}分</p>
                                  </div>
                                  <div>
                                    <span className="text-[var(--muted-foreground)]">参加者数:</span>
                                    <p className="font-medium text-[var(--foreground)]">{lesson.participants}名</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
