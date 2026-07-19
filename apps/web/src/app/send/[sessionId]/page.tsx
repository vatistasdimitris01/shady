import dynamic from 'next/dynamic';

const SendClient = dynamic(() => import('./SendClient'), { ssr: false, loading: () => (
  <div className="min-h-dvh flex flex-col items-center justify-center px-6">
    <div className="w-full max-w-[280px] text-center">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-zinc-500 text-xs">loading</p>
    </div>
  </div>
)});

export default async function SendPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <SendClient sessionId={sessionId} />;
}
