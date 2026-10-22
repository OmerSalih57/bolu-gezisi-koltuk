import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell.tsx'
import { TripSectionLayout } from '@/components/layout/TripSectionLayout.tsx'
import { ParticipantsPage } from '@/features/participants/ParticipantsPage.tsx'
import { AuditLogPage } from '@/features/audit/AuditLogPage.tsx'
import { PrintSchemasPage } from '@/features/seats/PrintSchemasPage.tsx'
import { SeatSelectionPage } from '@/features/seats/SeatSelectionPage.tsx'
import { TripsPage } from '@/features/trips/TripsPage.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TripsPage /> },
      { path: 'gizli-panel-loglar-7721', element: <AuditLogPage /> },
      { path: 'geziler/:tripId/cikti', element: <PrintSchemasPage /> },
      {
        path: 'geziler/:tripId',
        element: <TripSectionLayout />,
        children: [
          { index: true, element: <Navigate to="koltuklar" replace /> },
          { path: 'koltuklar', element: <SeatSelectionPage /> },
          { path: 'katilimcilar', element: <ParticipantsPage /> },
        ],
      },
    ],
  },
])
