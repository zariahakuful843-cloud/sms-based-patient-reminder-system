// Dedicated edit route for appointments.
// UI must remain unchanged; this page only provides the URL:
// - View:  /appointments/[id]
// - Edit:  /appointments/[id]/edit
//
// This project does not use NextAuth; rely on the existing dashboard client
// role/session logic inside app/(dashboard)/appointments/[id]/page.tsx.
import AppointmentDetailsPage from "../page";

export default function AppointmentEditPage() {
  return <AppointmentDetailsPage />;
}

