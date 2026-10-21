import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router.tsx'
import { TripProvider } from '@/components/providers/TripProvider.tsx'

export default function App() {
  return (
    <TripProvider>
      <RouterProvider router={router} />
    </TripProvider>
  )
}
