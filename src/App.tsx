import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { TasksPage } from '@/pages/TasksPage';
import { Toaster } from '@/components/ui/toaster';

const App: React.FC = () => {
  // 从环境变量获取base路径，用于GitHub Pages部署
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<TasksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
