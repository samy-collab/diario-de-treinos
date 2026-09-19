# Firestore Expo Example

Exemplo didático de um app Expo + React Native com TypeScript, Expo Router, Firebase Authentication e Cloud Firestore.

O app possui somente duas páginas:

- `login`: entrada com e-mail e senha ou criação de uma conta.
- `index`: criação e listagem em tempo real das tarefas do usuário autenticado.

Não existe autenticação anônima neste projeto.

## 1. Pré-requisitos

Instale ou tenha disponível:

- Node.js 22 ou superior.
- npm.
- Uma conta Google para acessar o Firebase Console.
- Expo Go no celular, caso queira testar no Android ou iOS.

Confira as versões instaladas:

```bash
node --version
npm --version
```

## 2. Criar o projeto no Firebase

1. Abra o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **Create a project**.
3. Escolha um nome para o projeto e conclua a criação.
4. Dentro do projeto, clique no ícone da Web `</>` para adicionar um app Web.
5. Dê um nome ao app Web e registre-o.
6. Guarde a configuração exibida pelo Firebase. Ela será usada no arquivo local do app.

A configuração tem este formato:

```ts
const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_PROJETO.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_PROJETO.firebasestorage.app',
  messagingSenderId: 'SEU_SENDER_ID',
  appId: 'SEU_APP_ID',
};
```

## 3. Habilitar login com e-mail e senha

No Firebase Console:

1. Acesse **Build > Authentication**.
2. Clique em **Get started**, se necessário.
3. Abra a aba **Sign-in method**.
4. Selecione **Email/Password**.
5. Ative **Email/Password**.
6. Salve.

O botão **Criar conta** do app usa `createUserWithEmailAndPassword`. O botão **Entrar** usa `signInWithEmailAndPassword`.

## 4. Criar o banco Firestore

No Firebase Console:

1. Acesse **Build > Firestore Database**.
2. Clique em **Create database**.
3. Escolha **Production mode**.
4. Escolha a região do banco.
5. Confirme em **Create**.

Se a API ainda não estiver habilitada, abra a [Cloud Firestore API](https://console.cloud.google.com/apis/library/firestore.googleapis.com) e clique em **Enable**.

O banco padrão precisa existir antes de o app conseguir listar ou criar tarefas. Sem ele, o Firebase retorna `The database (default) does not exist`.

## 5. Configurar o arquivo local do app

Na raiz deste projeto, execute:

```bash
cp src/lib/firebaseConfig.example.ts src/lib/firebaseConfig.ts
```

Abra `src/lib/firebaseConfig.ts` e substitua os valores de exemplo pelos valores copiados na etapa 2.

O arquivo usado pelo app é:

```text
src/lib/firebaseConfig.ts
```

Esse arquivo está no `.gitignore` e não deve ser commitado. Somente `firebaseConfig.example.ts`, com placeholders, deve ser versionado.

Confirme que ele está ignorado:

```bash
git check-ignore -v src/lib/firebaseConfig.ts
```

## 6. Publicar as regras do Firestore

As regras deste projeto permitem que um usuário autenticado leia e crie somente documentos cujo `userId` seja o próprio ID de autenticação. Elas estão em [firestore.rules](firestore.rules).

Use exatamente estas regras:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;

      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.title is string
        && request.resource.data.title.size() > 0
        && request.resource.data.title.size() <= 120;

      allow update, delete: if false;
    }
  }
}
```

Depois de publicar, a coleção `tasks` não precisa ser criada manualmente. Ela será criada automaticamente quando o app executar `addDoc` pela primeira vez.

### Opção A: Firebase Console

1. Acesse **Build > Firestore Database > Rules**.
2. Copie o conteúdo de `firestore.rules`.
3. Cole no editor de regras.
4. Clique em **Publish**.

### Opção B: Firebase CLI

O arquivo `.firebaserc` já aponta para o projeto `my-app-firebase-3fa29`. Para usar outro projeto, altere esse arquivo ou selecione o projeto com `firebase use`.

Faça login e publique as regras:

```bash
npx firebase-tools login
npx firebase-tools projects:list
npx firebase-tools deploy --only firestore:rules
```

O arquivo `firebase.json` informa à CLI que as regras estão em `firestore.rules`.

## 7. Instalar e executar o app

Na raiz de `firestore-expo-example`:

```bash
npm install
npm run typecheck
npx expo start -c
```

Para testar no celular:

1. Instale o Expo Go.
2. Deixe o computador e o celular na mesma rede Wi-Fi.
3. Escaneie o QR code exibido pelo Expo.

Para testar no navegador:

```bash
npm run web
```

## 8. Testar o fluxo completo

1. Abra o app na tela de login.
2. Informe um e-mail válido e uma senha com pelo menos 6 caracteres.
3. Clique em **Criar conta**.
4. Confirme no Firebase Console que o usuário apareceu em **Authentication > Users**.
5. Crie uma tarefa na tela inicial.
6. Confirme que a tarefa apareceu na lista.
7. Recarregue o app e confirme que a tarefa continua salva.
8. Crie uma segunda conta e confirme que ela não vê as tarefas da primeira conta.

## 9. Como a criação funciona

O exemplo deixa a criação na tela para facilitar a explicação em aula:

```ts
await addDoc(collection(db, 'tasks'), {
  title: 'Estudar Firestore', // valor da tarefa
  userId: user.uid, // dono do documento
  createdAt: serverTimestamp(), // data do servidor Firebase
});
```

Leia o trecho em três partes:

1. `collection(db, 'tasks')` escolhe a coleção `tasks`.
2. `addDoc(...)` cria um documento com um ID automático.
3. O objeto contém os campos que serão salvos.

O campo `userId` é importante porque as regras usam esse valor para separar os dados de cada usuário. Depois que o documento é criado, o `onSnapshot` atualiza a lista automaticamente.

## 10. Validação do usuário

Antes de mostrar as tarefas, o app usa `onAuthStateChanged` para verificar se existe um usuário autenticado:

```ts
onAuthStateChanged(auth, (user) => {
  setUserId(user?.uid ?? null);
});

if (!userId) {
  return <Redirect href="/login" />;
}
```

Sem usuário autenticado, a página de tarefas não é exibida.

## 11. Solução de problemas

### `Missing or insufficient permissions`

Verifique:

- Se o provedor **Email/Password** está habilitado.
- Se você clicou em **Publish** nas regras do Firestore.
- Se o usuário realmente conseguiu entrar ou criar uma conta.
- Se o app está usando o mesmo projeto indicado em `firebaseConfig.ts`.
- Se a consulta usa `where('userId', '==', userId)`, como neste projeto.

### `The database (default) does not exist`

Crie o banco em **Firestore Database > Create database** e aguarde alguns segundos antes de reiniciar o Expo.

### `auth/invalid-credential`

Confira o e-mail e a senha. Se for o primeiro acesso, use **Criar conta** antes de usar **Entrar**.

### A tela fica carregando ou o botão fica em `Salvando...`

Confira a conexão de internet, a existência do banco e a publicação das regras. O app interrompe a espera depois de alguns segundos e exibe uma mensagem de diagnóstico.

Depois de alterar a configuração local, reinicie o bundler limpando o cache:

```bash
npx expo start -c
```

## Estrutura principal

```text
src/
  app/
    _layout.tsx             # Stack principal
    login.tsx               # Login e criação de conta
    index.tsx               # Criação e listagem de tarefas
  lib/
    firebase.ts             # Inicialização do Firebase
    firebaseConfig.ts       # Configuração local, ignorada pelo Git
    firebaseConfig.example.ts # Modelo sem credenciais
  services/
    tasks.ts                # Auth e leitura em tempo real
  types/
    task.ts                 # Tipo da tarefa
firestore.rules             # Regras de acesso do Firestore
firebase.json               # Configuração da Firebase CLI
.firebaserc                 # Projeto Firebase selecionado
```
