# Firestore Expo Example

Exemplo didático de um app Expo + React Native com TypeScript, Expo Router, autenticação anônima e Firestore.

## O que o exemplo demonstra

- Estrutura de rotas em `src/app` usando `Stack`.
- Login com e-mail e senha usando Firebase Authentication.
- Validação do usuário antes de abrir a tela de tarefas.
- Criação de documentos na coleção `tasks`.
- Listagem em tempo real com `onSnapshot`.
- Regras do Firestore separando os documentos por usuário.

## Como criar um documento

O exemplo deixa a criação na tela para facilitar a explicação em aula:

```ts
await addDoc(collection(db, 'tasks'), {
  title: 'Estudar Firestore', // valor da tarefa
  userId: user.uid, // dono do documento
  createdAt: serverTimestamp(), // data do servidor Firebase
});
```

Leia esse trecho em três partes:

1. `collection(db, 'tasks')` escolhe a coleção.
2. `addDoc(...)` cria um documento com um ID automático.
3. O objeto contém os campos que serão salvos.

Depois que o documento é criado, o `onSnapshot` atualiza a lista automaticamente.

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Adicione um app Web ao projeto e copie a configuração apresentada.
3. Ative o provedor **Email/Password** em **Authentication > Sign-in method**.
4. Crie o banco em **Firestore Database**.
5. Confira os valores de `src/lib/firebaseConfig.example.ts` com a configuração do Firebase Console.
6. Publique as regras de `firestore.rules` no Firestore Console ou pela Firebase CLI.

Se a tela ficar carregando, confirme também que a **Cloud Firestore API** está habilitada no projeto:

<https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=my-app-firebase-3fa29>

Depois de habilitar a API ou criar o banco, aguarde alguns segundos e reinicie o Expo.

## Validação do usuário

Antes de mostrar as tarefas, o app usa `onAuthStateChanged` para verificar se existe um usuário autenticado:

```ts
onAuthStateChanged(auth, (user) => {
  setUserId(user?.uid ?? null);
});

if (!userId) {
  return <Redirect href="/login" />;
}

// A partir daqui, o usuário está autenticado.
```

Neste exemplo:

- **Entrar** usa `signInWithEmailAndPassword`.
- **Criar conta** usa `createUserWithEmailAndPassword`.

Não existe autenticação anônima neste app.

O app importa a configuração de `src/lib/firebaseConfig.example.ts`. Os valores da configuração Web identificam o projeto, mas as regras do Firestore continuam sendo a proteção dos dados.

## Executar

```bash
npm install
npm start
```

Depois, abra o projeto no Expo Go usando o QR code ou pressione `w` para abrir a versão web.

## Estrutura principal

```text
src/
  app/
    _layout.tsx   # Stack principal
    login.tsx     # Entrada do usuário
    index.tsx     # Tela de tarefas
  lib/
    firebase.ts   # Inicialização do Firebase
  services/
    tasks.ts      # Auth anônima e leitura em tempo real
  types/
    task.ts       # Tipo da tarefa
```
# app-example-firestore
