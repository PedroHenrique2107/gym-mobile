import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/navigation/page-header';
import { buttonVariants } from '@/components/ui/button';
import { AdminAccountsPanel } from '@/features/admin/admin-accounts-panel';
import { SignOutButton } from '@/features/auth/sign-out-button';
import { AccountExportButton } from '@/features/profile/account-export-button';
import { ProfileForm } from '@/features/profile/profile-form';
import { NotificationSettings } from '@/features/pwa/notification-settings';
import { PwaSettings } from '@/features/pwa/pwa-settings';

export const metadata: Metadata = { title: 'Perfil' };

export default function PerfilPage() {
  return (
    <>
      <PageHeader title="Perfil" subtitle="Seus dados, objetivo e preferencias." />

      <ProfileForm />
      <AdminAccountsPanel />
      <PwaSettings />
      <NotificationSettings />

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
        <AccountExportButton />
        <Link href="/status" className={buttonVariants({ variant: 'outline' })}>
          Ver status da API
        </Link>
        <SignOutButton />
      </div>
    </>
  );
}
