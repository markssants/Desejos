import { useEffect, useState } from 'react';

// Proxy público de imagens: contorna sites que bloqueiam exibir a foto fora deles
const viaProxy = (url) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800`;

// Tenta carregar direto (sem enviar referer); se falhar, tenta pelo proxy.
export default function Imagem({ src, onError, ...props }) {
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => setTentativa(0), [src]);

  if (!src) return null;
  const podeProxy = /^https?:\/\//i.test(src);
  const url = tentativa === 0 ? src : viaProxy(src);

  return (
    <img
      {...props}
      src={url}
      referrerPolicy="no-referrer"
      onError={() => {
        if (tentativa === 0 && podeProxy) setTentativa(1);
        else onError?.();
      }}
    />
  );
}
