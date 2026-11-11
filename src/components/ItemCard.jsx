import { moeda, PRIORIDADES } from '../utils';

export default function ItemCard({ item, onEditar, onComprado, onExcluir }) {
  const qtd = Number(item.quantidade) || 1;
  const temPreco = item.preco != null && item.preco !== '';

  return (
    <li className={`card ${item.comprado ? 'comprado' : ''}`}>
      <div className="card-img" onClick={onEditar}>
        {item.imagem ? <img src={item.imagem} alt="" loading="lazy" /> : <span>♥</span>}
        {!item.comprado && (
          <span className={`tag p-${item.prioridade}`}>{PRIORIDADES[item.prioridade]?.label}</span>
        )}
      </div>
      <div className="card-corpo">
        <h3 onClick={onEditar}>
          {qtd > 1 && <span className="qtd">{qtd}×</span>} {item.nome}
        </h3>
        <div className="meta muted">
          {[item.loja, item.categoria].filter(Boolean).join(' · ')}
        </div>
        {temPreco && (
          <div className="preco">
            {moeda(item.preco * qtd)}
            {qtd > 1 && <small className="muted"> ({moeda(item.preco)} cada)</small>}
          </div>
        )}
        {item.notas && <p className="notas">{item.notas}</p>}
        <div className="card-acoes">
          {item.link && (
            <a className="btn" href={item.link} target="_blank" rel="noreferrer">Abrir link</a>
          )}
          <button className="btn" onClick={onComprado}>
            {item.comprado ? 'Desfazer' : '✓ Comprei'}
          </button>
          <button className="btn fantasma" onClick={onEditar} aria-label="Editar">✎</button>
          <button className="btn fantasma perigo" onClick={onExcluir} aria-label="Excluir">🗑</button>
        </div>
      </div>
    </li>
  );
}
