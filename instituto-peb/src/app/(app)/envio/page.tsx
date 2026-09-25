import { Uploader } from '@/components/envio/uploader';
import { Page } from '@/components/ui/card';

export default function EnvioPage() {
  return (
    <Page title="Novo lançamento" subtitle="Suba os arquivos e complete os dados em seguida. Cada arquivo vira um lançamento pendente de conferência.">
      <div className="max-w-[760px]">
        <Uploader />
      </div>
    </Page>
  );
}
