export const moeda = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const PRIORIDADES = {
  alta: { label: 'Alta', ordem: 0 },
  media: { label: 'Média', ordem: 1 },
  baixa: { label: 'Baixa', ordem: 2 },
};

// Descobre o nome da loja a partir do link
export function lojaDoLink(link) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '');
    if (host.includes('mercadolivre') || host.includes('mercadolibre')) return 'Mercado Livre';
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('shopee')) return 'Shopee';
    if (host.includes('aliexpress')) return 'AliExpress';
    if (host.includes('magazineluiza') || host.includes('magalu')) return 'Magalu';
    if (host.includes('kabum')) return 'KaBuM!';
    if (host.includes('americanas')) return 'Americanas';
    if (host.includes('casasbahia')) return 'Casas Bahia';
    const nome = host.split('.')[0];
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  } catch {
    return '';
  }
}

// Reduz a imagem e transforma em texto (data URL) pra guardar direto no Firestore,
// sem precisar do Firebase Storage (plano Blaze). Fica bem abaixo do limite de 1 MB por item.
export function comprimirImagem(blob, maxLado = 700) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let qualidade = 0.75;
      let data = canvas.toDataURL('image/jpeg', qualidade);
      while (data.length > 600_000 && qualidade > 0.3) {
        qualidade -= 0.15;
        data = canvas.toDataURL('image/jpeg', qualidade);
      }
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem'));
    };
    img.src = url;
  });
}

// Baixa uma imagem a partir do link e devolve uma cópia reduzida (data URL).
// Tenta primeiro pelo proxy wsrv.nl (que libera o download e converte pra JPG), depois direto.
export async function baixarImagem(url) {
  const tentativas = [
    `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1000&output=jpg&q=85`,
    url,
  ];
  for (const endereco of tentativas) {
    try {
      const resp = await fetch(endereco, { referrerPolicy: 'no-referrer' });
      if (!resp.ok) continue;
      const blob = await resp.blob();
      if (!blob.type.startsWith('image/')) continue;
      return await comprimirImagem(blob);
    } catch {
      // tenta a próxima
    }
  }
  throw new Error('Não foi possível baixar a imagem');
}
