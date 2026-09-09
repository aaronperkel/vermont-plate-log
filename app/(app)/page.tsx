import { LogForm } from '@/components/log-form';
import { countSightings } from '@/lib/queries/sightings';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Log a plate' };

export default async function LogPage() {
  const total = await countSightings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Log a plate</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {total === 0
            ? 'Nothing logged yet. Type a plate and it becomes the first entry — everything else in the app fills in from here.'
            : `${total.toLocaleString()} ${total === 1 ? 'plate' : 'plates'} so far.`}
        </p>
      </div>

      <LogForm />
    </div>
  );
}
