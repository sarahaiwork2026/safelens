import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { queryClient } from './lib/query';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/base.css';
const root=document.getElementById('root');if(root)createRoot(root).render(<StrictMode><ErrorBoundary><QueryClientProvider client={queryClient}><RouterProvider router={router}/></QueryClientProvider></ErrorBoundary></StrictMode>);
