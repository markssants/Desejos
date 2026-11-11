import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, firebaseConfigurado } from './firebase';
import { moeda, PRIORIDADES } from './utils';
import ItemForm from './components/ItemForm.jsx';
import ItemCard from './components/ItemCard.jsx';
import Imagem from './components/Imagem.jsx';

const SEM_CATEGORIA = 'Sem categoria';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = carregando
  const [itens, setItens] = useState([]);
  const [editando, setEditando] = useState(null); // null | 'novo' | item
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('quero'); // quero | comprados
  const [ordem, setOrdem] = useState('prioridade');
  const [categoria, setCategoria] = useState(null); // null = tela de categorias

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) { setItens([]); return; }
    const q = query(collection(db, 'users', user.uid, 'desejos'));
    return onSnapshot(q, (snap) => {
      setItens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const categorias = useMemo(
    () => [...new Set(itens.map((i) => i.categoria).filter(Boolean))].sort(),
    [itens]
  );

  const daAba = useMemo(
    () => itens.filter((i) => (aba === 'quero' ? !i.comprado : i.comprado)),
    [itens, aba]
  );

  // Agrupa os itens da aba atual por categoria (para a tela inicial)
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const i of daAba) {
      const nome = i.categoria || SEM_CATEGORIA;
      if (!mapa.has(nome)) mapa.set(nome, []);
      mapa.get(nome).push(i);
    }
    return [...mapa.entries()]
      .map(([nome, lista]) => ({
        nome,
        lista,
        total: lista.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.quantidade) || 1), 0),
        fotos: lista.filter((i) => i.imagem).slice(0, 4).map((i) => i.imagem),
      }))
      .sort((a, b) =>
        a.nome === SEM_CATEGORIA ? 1 : b.nome === SEM_CATEGORIA ? -1 : a.nome.localeCompare(b.nome, 'pt-BR')
      );
  }, [daAba]);

  const buscando = busca.trim() !== '';
  const mostrandoCategorias = categoria === null && !buscando;

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = daAba.filter((i) => {
      if (categoria !== null && !buscando && (i.categoria || SEM_CATEGORIA) !== categoria) return false;
      if (!termo) return true;
      return [i.nome, i.loja, i.notas, i.categoria].some((c) => c?.toLowerCase().includes(termo));
    });
    const data = (i) => i.criadoEm?.toMillis?.() ?? Date.now();
    const total = (i) => (Number(i.preco) || 0) * (Number(i.quantidade) || 1);
    const comparadores = {
      prioridade: (a, b) =>
        (PRIORIDADES[a.prioridade]?.ordem ?? 1) - (PRIORIDADES[b.prioridade]?.ordem ?? 1) || data(b) - data(a),
      recentes: (a, b) => data(b) - data(a),
      menor: (a, b) => total(a) - total(b),
      maior: (a, b) => total(b) - total(a),
    };
    return lista.sort(comparadores[ordem]);
  }, [daAba, busca, buscando, ordem, categoria]);

  const resumo = useMemo(() => {
    const pendentes = itens.filter((i) => !i.comprado);
    const total = pendentes.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.quantidade) || 1), 0);
    return { qtd: pendentes.length, total, comprados: itens.length - pendentes.length };
  }, [itens]);

  const ref = (id) => doc(db, 'users', user.uid, 'desejos', id);

  async function salvar(dados) {
    if (editando && editando !== 'novo') {
      await updateDoc(ref(editando.id), { ...dados, atualizadoEm: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'users', user.uid, 'desejos'), {
        ...dados, comprado: false, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
      });
    }
    setEditando(null);
  }

  const alternarComprado = (item) =>
    updateDoc(ref(item.id), {
      comprado: !item.comprado,
      compradoEm: item.comprado ? null : serverTimestamp(),
    });

  async function excluir(item) {
    if (confirm(`Excluir "${item.nome}"?`)) await deleteDoc(ref(item.id));
  }

  if (!firebaseConfigurado) {
    return (
      <div className="centro">
        <div className="caixa">
          <h1 className="logo">♥ Desejos</h1>
          <p>Firebase não configurado.</p>
          <p className="muted">
            Crie um arquivo <code>.env.local</code> a partir do <code>.env.example</code> (ou configure as
            variáveis na Vercel) e reinicie o app.
          </p>
        </div>
      </div>
    );
  }

  if (user === undefined) return <div className="centro"><div className="spinner" /></div>;

  if (!user) {
    return (
      <div className="centro">
        <div className="caixa">
          <h1 className="logo">♥ Desejos</h1>
          <p className="muted">Guarde tudo o que você quer comprar — com foto, preço e link — mesmo que o anúncio suma.</p>
          <button className="btn primario grande" onClick={() => signInWithPopup(auth, googleProvider)}>
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topo">
        <h1 className="logo">♥ Desejos</h1>
        <div className="usuario">
          {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
          <button className="btn fantasma" onClick={() => signOut(auth)}>Sair</button>
        </div>
      </header>

      <section className="resumo">
        <div><span className="muted">Na lista</span><strong>{resumo.qtd}</strong></div>
        <div><span className="muted">Total desejado</span><strong>{moeda(resumo.total)}</strong></div>
        <div><span className="muted">Já comprados</span><strong>{resumo.comprados}</strong></div>
      </section>

      <section className="controles">
        <div className="abas">
          <button className={aba === 'quero' ? 'ativa' : ''} onClick={() => setAba('quero')}>Quero comprar</button>
          <button className={aba === 'comprados' ? 'ativa' : ''} onClick={() => setAba('comprados')}>Comprados</button>
        </div>
        <input
          className="busca" type="search" placeholder="Buscar…"
          value={busca} onChange={(e) => setBusca(e.target.value)}
        />
        {!mostrandoCategorias && (
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="prioridade">Prioridade</option>
            <option value="recentes">Mais recentes</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        )}
      </section>

      {categoria !== null && !buscando && (
        <div className="trilha">
          <button className="btn fantasma" onClick={() => setCategoria(null)}>← Categorias</button>
          <h2>{categoria}</h2>
        </div>
      )}

      {mostrandoCategorias ? (
        grupos.length === 0 ? (
          <p className="vazio muted">
            {itens.length === 0 ? 'Nenhum desejo ainda. Toque em + para adicionar o primeiro!' : 'Nada por aqui.'}
          </p>
        ) : (
          <ul className="grade">
            {grupos.map((g) => (
              <li key={g.nome}>
                <button className="categoria" onClick={() => setCategoria(g.nome)}>
                  <div className={`mosaico n${g.fotos.length}`}>
                    {g.fotos.length ? g.fotos.map((src, k) => <Imagem key={k} src={src} alt="" loading="lazy" />) : <span>♥</span>}
                  </div>
                  <div className="categoria-info">
                    <strong>{g.nome}</strong>
                    <span className="muted">
                      {g.lista.length} {g.lista.length === 1 ? 'item' : 'itens'}
                      {g.total > 0 && ` · ${moeda(g.total)}`}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : visiveis.length === 0 ? (
        <p className="vazio muted">
          {itens.length === 0 ? 'Nenhum desejo ainda. Toque em + para adicionar o primeiro!' : 'Nada por aqui.'}
        </p>
      ) : (
        <ul className="grade">
          {visiveis.map((item) => (
            <ItemCard
              key={item.id} item={item}
              onEditar={() => setEditando(item)}
              onComprado={() => alternarComprado(item)}
              onExcluir={() => excluir(item)}
            />
          ))}
        </ul>
      )}

      <button className="fab" onClick={() => setEditando('novo')} aria-label="Adicionar desejo">+</button>

      {editando && (
        <ItemForm
          inicial={
            editando === 'novo'
              ? (categoria && categoria !== SEM_CATEGORIA ? { categoria } : null)
              : editando
          }
          categorias={categorias}
          onSalvar={salvar}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
