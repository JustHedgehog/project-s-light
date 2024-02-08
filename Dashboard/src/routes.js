import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from 'src/layouts/DashboardLayout';
import MainLayout from 'src/layouts/MainLayout';
import DashboardView from 'src/views/reports/DashboardView';
import AnalysisView from 'src/views/reports/AnalysisView';
import NotFoundView from 'src/views/errors/NotFoundView';
import ManageModelView from 'src/views/reports/ManageModelView'
import ManageExplainerView from 'src/views/reports/ManageExplainerView'

const routes = [
  {
    path: 'app',
    element: <DashboardLayout />,
    children: [
      { path: 'dashboard', element: <DashboardView /> },
      { path: 'analysis', element: <AnalysisView />},
      { path: 'model', element: <ManageModelView />},
      { path: 'explainer', element: <ManageExplainerView />},
      { path: '*', element: <Navigate to="/404" /> }
    ]
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '404', element: <NotFoundView /> },
      { path: '/', element: <Navigate to="/app/dashboard" /> },
      { path: '/analysis', element: <Navigate to="/app/analysis"/>},
      { path: '/model', element: <Navigate to="/app/model"/>},
      { path: '/explainer', element: <Navigate to="/app/explainer"/>},
      { path: '*', element: <Navigate to="/404" /> }
    ]
  }
];

export default routes;
