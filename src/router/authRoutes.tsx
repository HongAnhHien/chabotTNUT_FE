/* eslint-disable react-refresh/only-export-components */
import Register from '@/views/pages/authentication/Register';
import { lazy } from 'react';
import { type RouteObject } from 'react-router';

const BlankLayout = lazy(() => import('@core/layouts/BlankLayout'));

const Login      = lazy(() => import('@views/pages/authentication/Login'));
const ComingSoon = lazy(() => import('@views/misc/ComingSoon'));
const ErrorPage  = lazy(() => import('@views/misc/Error'));
const NotAuthorized = lazy(() => import('@views/misc/NotAuthorized'));
const Maintenance   = lazy(() => import('@views/misc/Maintenance'));

export const authRoutes: RouteObject[] = [
   // Auth
  {
    path: '/login',
    element: <BlankLayout><Login /></BlankLayout>,
  },
  {
    path: '/register',
    element: <BlankLayout><Register /></BlankLayout>,
  },
  {
    path: '/coming-soon',
    element: <BlankLayout><ComingSoon /></BlankLayout>,
  },
  {
    path: '/not-authorized',
    element: <BlankLayout><NotAuthorized /></BlankLayout>,
  },
  {
    path: '/maintenance',
    element: <BlankLayout><Maintenance /></BlankLayout>,
  },
  {
    path: '/error',
    element: (
      <BlankLayout>
        <ErrorPage errorCode="500" title="Server Error" message="Something went wrong." />
      </BlankLayout>
    ),
  },
];
