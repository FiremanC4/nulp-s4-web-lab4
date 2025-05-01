import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/authContext";
import IndexPage from "./pages/IndexPage";
import ProfilePage from "./pages/ProfilePage";
import ArticleViewPage from "./pages/ArticleViewPage";
import CreatePostPage from "./pages/CreatePostPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HelpPage from "./pages/HelpPage";
import "./styles/main.css";
import "./styles/header-footer.css";

const ProtectedRoute = ({ children }) => {
  const { userLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  return userLoggedIn ? children : <Navigate to="/nulp-s4-web-lab4/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router basename="/nulp-s4-web-lab4">
        <Routes>
          <Route path="/nulp-s4-web-lab4" element={<IndexPage />} />
          <Route path="/nulp-s4-web-lab4/profile" element={<ProfilePage />} />
          <Route path="/nulp-s4-web-lab4/article/:id" element={<ArticleViewPage />} />
          <Route path="/nulp-s4-web-lab4/login" element={<Login />} />
          <Route path="/nulp-s4-web-lab4/register" element={<Register />} />
          <Route path="/nulp-s4-web-lab4/help" element={<HelpPage />} />
          <Route
            path="/nulp-s4-web-lab4/create-post"
            element={
              <ProtectedRoute>
                <CreatePostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nulp-s4-web-lab4/edit-post/:id"
            element={
              <ProtectedRoute>
                <CreatePostPage isEdit={true} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
