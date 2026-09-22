import { Uploader } from '@/components/envio/uploader';
import { PageHeader } from '@/components/ui/card';

export default function EnvioPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Enviar documentos"
        description="Cada arquivo vira um lançamento pendente de revisão. XML e PDF da mesma nota são juntados automaticamente."
      />
      <Uploader />
    </div>
  );
}
