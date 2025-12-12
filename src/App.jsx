import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Welcome from './components/Welcome';
import Dashboard from './components/Dashboard';
import InstallPWA from './components/InstallPWA';
import { ThemeProvider } from './ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
        <InstallPWA />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;