import { Direction } from 'radix-ui';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from '@/app/router';
import { Toaster } from '@/components/ui/toaster';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Direction.Provider dir="rtl">
      <Toaster>
        <Suspense>
          <RouterProvider router={router} />
        </Suspense>
      </Toaster>
    </Direction.Provider>
  </StrictMode>,
);
