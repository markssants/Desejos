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
