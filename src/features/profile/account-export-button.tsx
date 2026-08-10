'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { describeApiError, requireApiData } from '@/lib/api/result';

export function AccountExportButton() {
  const [exporting, setExporting] = useState(false);

  async function exportAccount(): Promise<void> {
    setExporting(true);

    try {
      const { data, error } = await apiClient.GET('/api/v1/me/export');
      const exported = requireApiData(data, error, 'exportar os dados');
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'gymflow-export.json';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Exportacao preparada para download.');
    } catch (error) {
      toast.error(describeApiError(error, 'Nao foi possivel exportar seus dados.'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" size="lg" disabled={exporting} onClick={() => void exportAccount()}>
      <Download />
      {exporting ? 'Preparando...' : 'Exportar meus dados'}
    </Button>
  );
}
