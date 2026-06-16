import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StudentList   from './pages/StudentList';
import StudentForm   from './pages/StudentForm';
import StudentDetail from './pages/StudentDetail';
import { GraduationCap } from 'lucide-react';

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <GraduationCap size={22} />
          <span>StudentMS</span>
        </NavLink>
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Students
          </NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Layout>
        <Routes>
          <Route path="/"                    element={<StudentList />} />
          <Route path="/students/new"        element={<StudentForm />} />
          <Route path="/students/:id"        element={<StudentDetail />} />
          <Route path="/students/:id/edit"   element={<StudentForm />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
