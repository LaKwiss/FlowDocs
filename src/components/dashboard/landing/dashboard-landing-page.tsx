import { DashboardUsageCardGroup } from '@/components/dashboard/landing/components/dashboard-usage-card-group';
import { DashboardTutorialCard } from '@/components/dashboard/landing/components/dashboard-tutorial-card';

export function DashboardLandingPage() {
  return (
    <div className={'grid flex-1 items-start gap-6 p-0 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}>
      <div className={'grid auto-rows-max items-start gap-6 lg:col-span-2'}>
        <DashboardUsageCardGroup />
      </div>
      <div className={'grid auto-rows-max items-start gap-6'}>
        <DashboardTutorialCard />
      </div>
    </div>
  );
}
