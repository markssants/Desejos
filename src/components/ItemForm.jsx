import { useEffect, useRef, useState } from 'react';
import { baixarImagem, comprimirImagem, lojaDoLink } from '../utils';
import Imagem from './Imagem.jsx';

const VAZIO = {
  nome: '', link: '', loja: '', preco: '', quantidade: 1,
  imagem: '', imagemOrigem: '', categoria: '', prioridade: 'media', notas: '',
};

const pareceImagem = (url) =>
  /^https?:\/\/\S+\.(jpe?g|png|webp|gif|avif)(\?\S*)?$/i.test(url) || /^https?:\/\/[^/]*mlstatic\.com\//i.test(url);

export default function ItemForm({ inicial, categorias, onSalvar, onFechar }) {
  const [f, setF] = useState(() => ({ ...VAZIO, ...(inicial || {}) }));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [imgErro, setImgErro] = useState(false);
  // Link da imagem digitado; o app baixa uma cópia e guarda em f.imagem
  const [linkImg, setLinkImg] = useState(() =>
    inicial?.imagemOrigem || (/^https?:/i.test(inicial?.imagem || '') ? inicial.imagem : '')
  );
  const [statusImg, setStatusImg] = useState(''); // '' | baixando | ok | falhou | arquivo
  const copiaDe = useRef(inicial?.imagem?.startsWith('data:') ? inicial.imagemOrigem || null : null);
  const inputArquivo = useRef(null);

  // Sempre que o link da imagem muda, baixa e salva uma cópia
  useEffect(() => {
    const url = linkImg.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return;
    if (url === copiaDe.current) return; // já temos a cópia desse link
    let cancelado = false;
    setStatusImg('baixando');
    setImgErro(false);
    const t = setTimeout(async () => {
      try {
        const data = await baixarImagem(url);
        if (cancelado) return;
        copiaDe.current = url;
        setF((v) => ({ ...v, imagem: data, imagemOrigem: url }));
        setStatusImg('ok');
      } catch {
        if (cancelado) return;
        // Não deu pra baixar: guarda só o link
        setF((v) => ({ ...v, imagem: url, imagemOrigem: url }));
        setStatusImg('falhou');
      }
    }, 400);
    return () => { cancelado = true; clearTimeout(t); };
  }, [linkImg]);

  async function usarArquivo(arquivo) {
    if (!arquivo?.type?.startsWith('image/')) return;
    try {
      setErro('');
      const data = await comprimirImagem(arquivo);
      copiaDe.current = null;
      setLinkImg('');
      setImgErro(false);
      setF((v) => ({ ...v, imagem: data, imagemOrigem: '' }));
      setStatusImg('arquivo');
    } catch (e) {
      setErro(e.message);
    }
  }

  // Colar um print (Ctrl/⌘+V) em qualquer lugar do formulário
  function aoColar(e) {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      usarArquivo(item.getAsFile());
    }
  }

  function removerImagem() {
    copiaDe.current = null;
    setLinkImg('');
    setImgErro(false);
    setStatusImg('');
    setF((v) => ({ ...v, imagem: '', imagemOrigem: '' }));
  }

  const set = (campo) => (e) => setF((v) => ({ ...v, [campo]: e.target.value }));

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  function aoMudarLink(e) {
    const link = e.target.value.trim();
    // Se colaram o link de uma imagem no campo do produto, joga pro campo da foto
    if (pareceImagem(link)) {
      setLinkImg(link);
      setF((v) => ({ ...v, link: '' }));
      return;
    }
    setF((v) => ({ ...v, link: e.target.value, loja: v.loja || lojaDoLink(link) }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!f.nome.trim()) return setErro('Dê um nome ao item.');
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        nome: f.nome.trim(),
        link: f.link.trim(),
        loja: f.loja.trim(),
        preco: f.preco === '' ? null : Number(String(f.preco).replace(',', '.')),
        quantidade: Math.max(1, Number(f.quantidade) || 1),
        imagem: f.imagem.trim(),
        imagemOrigem: f.imagemOrigem || '',
        categoria: f.categoria.trim(),
        prioridade: f.prioridade,
        notas: f.notas.trim(),
      });
    } catch (err) {
      setErro('Erro ao salvar: ' + err.message);
      setSalvando(false);
    }
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal" onSubmit={enviar} onPaste={aoColar}>
        <div className="modal-topo">
          <h2>{inicial?.id ? 'Editar desejo' : 'Novo desejo'}</h2>
          <button type="button" className="btn fantasma" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>

        <label>Nome *
          <input autoFocus value={f.nome} onChange={set('nome')} placeholder="Ex: Faca do chef 8&quot;" />
        </label>

        <label>Link do produto
          <input type="url" value={f.link} onChange={aoMudarLink} placeholder="https://www.mercadolivre.com.br/…" />
        </label>

        <div className="linha">
          <label>Preço (R$)
            <input inputMode="decimal" value={f.preco ?? ''} onChange={set('preco')} placeholder="0,00" />
          </label>
          <label className="curto">Qtd.
            <input type="number" min="1" value={f.quantidade} onChange={set('quantidade')} />
          </label>
        </div>

        <div className="linha">
          <label>Loja
            <input value={f.loja} onChange={set('loja')} placeholder="Mercado Livre" />
          </label>
          <label>Categoria
            <input list="cats" value={f.categoria} onChange={set('categoria')} placeholder="Cozinha" />
            <datalist id="cats">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
        </div>

        <label>Prioridade
          <div className="segmentado">
            {['alta', 'media', 'baixa'].map((p) => (
              <button
                type="button" key={p}
                className={`${f.prioridade === p ? 'ativa' : ''} p-${p}`}
                onClick={() => setF((v) => ({ ...v, prioridade: p }))}
              >
                {{ alta: 'Alta', media: 'Média', baixa: 'Baixa' }[p]}
              </button>
            ))}
          </div>
        </label>

        <div className="campo-imagem">
          <label>Foto
            <div className="linha">
              <input
                type="url" value={linkImg}
                onChange={(e) => setLinkImg(e.target.value.trim())}
                placeholder="Cole o link da imagem…"
              />
              <button type="button" className="btn" onClick={() => inputArquivo.current.click()}>
                Enviar arquivo
              </button>
            </div>
          </label>
          <input
            ref={inputArquivo} type="file" accept="image/*" hidden
            onChange={(e) => { usarArquivo(e.target.files[0]); e.target.value = ''; }}
          />
          {(f.imagem || statusImg === 'baixando') && (
            <div className="preview">
              {statusImg === 'baixando' ? (
                <div className="preview-carregando"><div className="spinner" /></div>
              ) : imgErro ? (
                <small className="erro">Não foi possível carregar a imagem desse link.</small>
              ) : (
                <Imagem src={f.imagem} alt="" onError={() => setImgErro(true)} />
              )}
              <div className="preview-info">
                <small className={statusImg === 'falhou' ? 'aviso' : 'muted'}>
                  {{
                    baixando: 'Salvando uma cópia da imagem…',
                    ok: '✓ Cópia salva — não some mesmo se o anúncio sair do ar.',
                    arquivo: '✓ Imagem salva.',
                    falhou: 'Não deu pra salvar uma cópia; vou guardar só o link.',
                  }[statusImg] ||
                    (f.imagem.startsWith('data:') ? '✓ Cópia salva.' : 'Só o link está salvo.')}
                </small>
                <button type="button" className="btn fantasma" onClick={removerImagem}>Remover</button>
              </div>
            </div>
          )}
          {!f.imagem && statusImg !== 'baixando' && (
            <small className="muted">Dica: você também pode colar um print aqui com Ctrl/⌘+V.</small>
          )}
        </div>

        <label>Notas
          <textarea rows="3" value={f.notas} onChange={set('notas')} placeholder="Cor, tamanho, modelo, vendedor…" />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <div className="modal-acoes">
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn primario" disabled={salvando || statusImg === 'baixando'}>
            {salvando ? 'Salvando…' : statusImg === 'baixando' ? 'Baixando imagem…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
