# ♥ Desejos

Lista pessoal de coisas que quero comprar — com foto, preço, quantidade, link e notas.
Os dados ficam salvos no Firebase, então não somem quando o anúncio sai do ar.

Stack: React + Vite · Firebase (Auth Google + Firestore) · deploy na Vercel.

## 1. Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com → **Adicionar projeto** → nome `desejos`.
2. **Authentication** → Começar → aba *Sign-in method* → ative **Google**.
3. **Firestore Database** → Criar banco de dados → modo produção → região `southamerica-east1` (São Paulo).
4. Na aba **Regras** do Firestore, cole o conteúdo de [`firestore.rules`](firestore.rules) e publique.
5. ⚙️ **Configurações do projeto** → *Seus apps* → ícone **Web (`</>`)** → registre o app e copie o `firebaseConfig`.

## 2. Rodar localmente

```bash
cp .env.example .env.local   # preencha com os valores do firebaseConfig
npm install
npm run dev
```

## 3. GitHub

```bash
git init
git add .
git commit -m "Desejos: primeira versão"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/desejos.git
git push -u origin main
```

## 4. Deploy na Vercel

1. https://vercel.com/new → importe o repositório `desejos` (o framework *Vite* é detectado sozinho).
2. Em **Environment Variables**, adicione as 6 variáveis `VITE_FIREBASE_*` do `.env.local`.
3. **Deploy**.
4. Volte no Firebase → **Authentication → Settings → Domínios autorizados** → adicione o domínio da Vercel
   (ex.: `desejos.vercel.app`). Sem isso o login com Google não funciona no site publicado.

## Recursos

- Login com Google (cada conta vê só a própria lista)
- Nome, link, loja (detectada pelo link), preço, quantidade, categoria, prioridade e notas
- Foto pelo link de uma imagem já hospedada (com pré-visualização)
- Total desejado, abas *Quero comprar* / *Comprados*, busca, filtro por categoria e ordenação
- Funciona offline (cache local do Firestore) e tem tema escuro automático
