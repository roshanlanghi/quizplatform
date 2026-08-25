import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminCreateQuestionPage from './pages/admin/AdminCreateQuestionPage';
import AdminEditQuestionPage from './pages/admin/AdminEditQuestionPage';
import AdminPapersPage from './pages/admin/AdminPapersPage';
import AdminPaperReviewPage from './pages/admin/AdminPaperReviewPage';
import AdminAIGeneratorPage from './pages/admin/AdminAIGeneratorPage';

import QuizCatalogPage from './pages/QuizCatalogPage';
import QuizTakerPage from './pages/QuizTakerPage';
import QuizResultPage from './pages/QuizResultPage';

import RevisionPage from './pages/RevisionPage';
import AnalyticsPage from './pages/AnalyticsPage';

function PublicLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public & Student Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute>
                    <QuizCatalogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:id/take"
                element={
                  <ProtectedRoute>
                    <QuizTakerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/results/:attemptId"
                element={
                  <ProtectedRoute>
                    <QuizResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/revision"
                element={
                  <ProtectedRoute>
                    <RevisionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="subjects" element={<AdminSubjectsPage />} />
              <Route path="questions" element={<AdminQuestionsPage />} />
              <Route path="questions/new" element={<AdminCreateQuestionPage />} />
              <Route path="questions/:id/edit" element={<AdminEditQuestionPage />} />
              <Route path="papers" element={<AdminPapersPage />} />
              <Route path="papers/:id/review" element={<AdminPaperReviewPage />} />
              <Route path="ai-generator" element={<AdminAIGeneratorPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
