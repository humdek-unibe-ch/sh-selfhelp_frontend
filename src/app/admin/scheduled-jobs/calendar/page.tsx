import { Suspense } from "react";
import { AdminShell } from '../../../components/cms/admin-shell/AdminShell';
import { LoadingScreen } from '../../../components/shared/common/LoadingScreen';
import ScheduledJobsCalendar from "../../../components/cms/scheduled-jobs/scheduled-jobs-calendar/ScheduledJobsCalendar";

export default function CalendarRoute() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingScreen />}>
        <ScheduledJobsCalendar />
      </Suspense>
    </AdminShell>
  );
}
