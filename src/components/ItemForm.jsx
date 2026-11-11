import { useEffect, useRef, useState } from 'react';
import { comprimirImagem, lojaDoLink } from '../utils';

const VAZIO = {
  nome: '', link: '', loja: '', preco: '', quantidade: 1,
  imagem: '', categoria: '', prioridade: 'media', notas: '',
};

export default function ItemForm({ inicial, categorias, onSalvar, onFechar }) {
  const [f, setF] = useState(() => ({ ...VAZIO, ...(inicial || {}) }));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputArquivo = useRef(null);

  const set = (campo) => (e) => setF((v) => ({ ...v, [campo]: e.target.value }));

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  async function usarArquivo(arquivo) {
    if (!arquivo?.type.startsWith('image/')) return;
    try {
      setErro('');
      const dataUrl = await comprimirImagem(arquivo);
      setF((v) => ({ ...v, imagem: dataUrl }));
    } catch (e) {
      setErro(e.message);
    }
  }

  // Permite colar uma imagem (Ctrl/Cmd+V) direto no formulário
  function aoColar(e) {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      usarArquivo(item.getAsFile());
    }
  }

  function aoMudarLink(e) {
    const link = e.target.value;
    setF((v) => ({ ...v, link, loja: v.loja || lojaDoLink(link) }));
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
        categoria: f.categoria.trim(),
        prioridade: f.prioridade,
        notas: f.notas.trim(),
      });
    } catch (err) {
      setErro('Erro ao salvar: ' + err.message);
      setSalvando(false);
    }
  }

  const imagemEhArquivo = f.imagem.startsWith('data:');

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal" onSubmit={enviar} onPaste={aoColar}>
        <div className="modal-topo">
          <h2>{inicial ? 'Editar desejo' : 'Novo desejo'}</h2>
          <button type="button" className="btn fantasma" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>

        <label>Nome *
          <input autoFocus value={f.nome} onChange={set('nome')} placeholder="Ex: Faca do chef 8&quot;" />
        </label>

        <label>Link
          <input type="url" value={f.link} onChange={aoMudarLink} placeholder="https://…" />
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
          <span>Foto</span>
          {f.imagem && (
            <div className="preview">
              <img src={f.imagem} alt="" />
              <button type="button" className="btn fantasma" onClick={() => setF((v) => ({ ...v, imagem: '' }))}>
                Remover
              </button>
            </div>
          )}
          <div className="linha">
            <button type="button" className="btn" onClick={() => inputArquivo.current.click()}>
              Enviar foto
            </button>
            {!imagemEhArquivo && (
              <input value={f.imagem} onChange={set('imagem')} placeholder="…ou cole a URL da imagem" />
            )}
          </div>
          <small className="muted">
            Dica: tire um print do anúncio e cole aqui (Ctrl/⌘+V). A foto enviada fica salva mesmo se o anúncio sumir.
          </small>
          <input
            ref={inputArquivo} type="file" accept="image/*" hidden
            onChange={(e) => usarArquivo(e.target.files[0])}
          />
        </div>

        <label>Notas
          <textarea rows="3" value={f.notas} onChange={set('notas')} placeholder="Cor, tamanho, modelo, vendedor…" />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <div className="modal-acoes">
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
