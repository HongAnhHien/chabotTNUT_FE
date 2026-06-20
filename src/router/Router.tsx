/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router';
import { authRoutes } from './authRoutes';
import { appRoutes } from './appRoutes';

const BlankLayout = lazy(() => import('@core/layouts/BlankLayout'));
const ErrorPage   = lazy(() => import('@views/misc/Error'));

const LoadingFallback = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #0a2f1f 0%, #0a3d3d 50%, #0a2d4d 100%)' }}
  >
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
      <p className="text-white font-medium text-sm">Đang tải...</p>
    </div>
  </div>
);

const routes: RouteObject[] = [
  ...authRoutes,
  ...appRoutes,
  {
    path: '*',
    element: (
      <BlankLayout>
        <ErrorPage errorCode="404" title="Không tìm thấy trang" message="Trang bạn tìm kiếm không tồn tại." />
      </BlankLayout>
    ),
  },
];

const router = createBrowserRouter(routes);

const Router = () => (
  <Suspense fallback={<LoadingFallback />}>
    <RouterProvider router={router} />
  </Suspense>
);

export default Router;
