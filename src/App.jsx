import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const STORAGE_KEY = 'sgt-state-v1';
const SESSION_KEY = 'sgt-session-v1';

const initialSeed = {
  users: [
    {
      id: 'u1',
      name: 'Aluno Demo',
      email: 'demo@sgt.com',
      password: '12345678',
      createdAt: new Date().toISOString(),
    },
  ],
  subjects: [
    {
      id: 'm1',
      name: 'Desenvolvimento Web',
      teacher: 'Prof. Ana Lima',
      color: '#2563eb',
      description: 'Front-end, componentes e integração com APIs.',
      userId: 'u1',
    },
    {
      id: 'm2',
      name: 'Banco de Dados',
      teacher: 'Prof. Carlos Souza',
      color: '#16a34a',
      description: 'Modelagem, SQL e persistência.',
      userId: 'u1',
    },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Entrega do wireframe',
      description: 'Finalizar protótipo das telas principais.',
      priority: 'Alta',
      status: 'Em andamento',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      subjectId: 'm1',
      userId: 'u1',
    },
    {
      id: 't2',
      title: 'Lista de SQL',
      description: 'Resolver exercícios de joins e consultas.',
      priority: 'Média',
      status: 'Pendente',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      subjectId: 'm2',
      userId: 'u1',
    },
  ],
  grades: [
    { id: 'n1', score: 8.5, note: 'Prova 1', subjectId: 'm1', userId: 'u1' },
    { id: 'n2', score: 7.2, note: 'Trabalho 1', subjectId: 'm2', userId: 'u1' },
  ],
  goals: [
    {
      id: 'g1',
      title: 'Estudar 5 horas na semana',
      description: 'Distribuir 1h por dia útil.',
      progress: 60,
      period: 'Semanal',
      userId: 'u1',
    },
  ],
  messages: [
    {
      id: 'c1',
      room: 'Turma',
      text: 'Pessoal, vamos combinar a divisão das tarefas do TCC.',
      userName: 'Aluno Demo',
      createdAt: new Date().toISOString(),
      userId: 'u1',
    },
  ],
  groups: [
    {
      id: 'gTcc1',
      name: 'Grupo TCC Alpha',
      description: 'Equipe responsável pelo SGT.',
      members: ['Aluno Demo', 'Mariana', 'João'],
    },
  ],
};

const emptyState = {
  users: [],
  subjects: [],
  tasks: [],
  grades: [],
  goals: [],
  messages: [],
  groups: [],
};

function loadState() {
  if (typeof window === 'undefined') return initialSeed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSeed;
    const parsed = JSON.parse(raw);
    return { ...emptyState, ...parsed };
  } catch {
    return initialSeed;
  }
}

function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function authReducer(state, action) {
  switch (action.type) {
    case 'register': {
      const exists = state.users.some((user) => user.email.toLowerCase() === action.payload.email.toLowerCase());
      if (exists) return { ...state, authError: 'E-mail já cadastrado.' };
      const user = {
        id: uid('u'),
        name: action.payload.name,
        email: action.payload.email,
        password: action.payload.password,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        users: [...state.users, user],
        session: { userId: user.id, remember: action.payload.remember },
        authError: null,
      };
    }
    case 'login': {
      const user = state.users.find(
        (item) =>
          item.email.toLowerCase() === action.payload.email.toLowerCase() &&
          item.password === action.payload.password,
      );
      if (!user) return { ...state, authError: 'Credenciais inválidas.' };
      return {
        ...state,
        session: { userId: user.id, remember: action.payload.remember },
        authError: null,
      };
    }
    case 'logout':
      return { ...state, session: null };
    case 'clearAuthError':
      return { ...state, authError: null };
    default:
      return state;
  }
}

function dataReducer(state, action) {
  switch (action.type) {
    case 'upsertSubject': {
      const item = action.payload.id
        ? action.payload
        : { ...action.payload, id: uid('m'), userId: action.userId };
      return {
        ...state,
        subjects: action.payload.id
          ? state.subjects.map((subject) => (subject.id === item.id ? item : subject))
          : [...state.subjects, item],
      };
    }
    case 'deleteSubject':
      return { ...state, subjects: state.subjects.filter((subject) => subject.id !== action.id) };
    case 'upsertTask': {
      const item = action.payload.id
        ? action.payload
        : { ...action.payload, id: uid('t'), userId: action.userId };
      return {
        ...state,
        tasks: action.payload.id ? state.tasks.map((task) => (task.id === item.id ? item : task)) : [...state.tasks, item],
      };
    }
    case 'toggleTask':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, status: task.status === 'Concluída' ? 'Pendente' : 'Concluída' } : task,
        ),
      };
    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };
    case 'upsertGrade': {
      const item = action.payload.id
        ? action.payload
        : { ...action.payload, id: uid('n'), userId: action.userId };
      return {
        ...state,
        grades: action.payload.id ? state.grades.map((grade) => (grade.id === item.id ? item : grade)) : [...state.grades, item],
      };
    }
    case 'deleteGrade':
      return { ...state, grades: state.grades.filter((grade) => grade.id !== action.id) };
    case 'upsertGoal': {
      const item = action.payload.id
        ? action.payload
        : { ...action.payload, id: uid('g'), userId: action.userId };
      return {
        ...state,
        goals: action.payload.id ? state.goals.map((goal) => (goal.id === item.id ? item : goal)) : [...state.goals, item],
      };
    }
    case 'deleteGoal':
      return { ...state, goals: state.goals.filter((goal) => goal.id !== action.id) };
    case 'addMessage':
      return { ...state, messages: [...state.messages, { ...action.payload, id: uid('c') }] };
    case 'upsertGroup': {
      const item = action.payload.id ? action.payload : { ...action.payload, id: uid('gTcc') };
      return {
        ...state,
        groups: action.payload.id ? state.groups.map((group) => (group.id === item.id ? item : group)) : [...state.groups, item],
      };
    }
    case 'deleteGroup':
      return { ...state, groups: state.groups.filter((group) => group.id !== action.id) };
    default:
      return state;
  }
}

const AppContext = createContext(null);

function AppProvider({ children }) {
  const [appState, dispatchBase] = useReducer((state, action) => {
    const authActions = ['register', 'login', 'logout', 'clearAuthError'];
    if (authActions.includes(action.type)) return authReducer(state, action);
    return dataReducer(state, action);
  }, {
    ...loadState(),
    session: typeof window === 'undefined' ? null : JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null'),
    authError: null,
  });

  useEffect(() => {
    const persisted = { ...appState };
    delete persisted.session;
    delete persisted.authError;
    saveState(persisted);
    if (appState.session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(appState.session));
    else window.localStorage.removeItem(SESSION_KEY);
  }, [appState]);

  const value = useMemo(() => {
    const currentUser = appState.users.find((user) => user.id === appState.session?.userId) || null;
    return {
      ...appState,
      currentUser,
      dispatch: dispatchBase,
    };
  }, [appState]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider.');
  return context;
}

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/home');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/home');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return [hash, (next) => (window.location.hash = next)];
}

function AppShell() {
  const { currentUser, dispatch, tasks, subjects, grades, goals, messages, groups } = useApp();
  const [hash, navigate] = useHashRoute();
  const path = hash.replace(/^#/, '') || '/home';

  useEffect(() => {
    if (!currentUser && path.startsWith('/app')) navigate('/login');
  }, [currentUser, path]);

  useEffect(() => {
    if (currentUser && ['/home', '/login', '/cadastro'].includes(path)) navigate('/app/dashboard');
  }, [currentUser, path]);

  if (!currentUser) {
    return <PublicShell path={path} navigate={navigate} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SGT</div>
          <div>
            <strong>Sistema de Gerenciamento</strong>
            <span>Tarefas e Organização Acadêmica</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Navegação principal">
          {[
            ['Painel', '/app/dashboard'],
            ['Matérias', '/app/materias'],
            ['Tarefas', '/app/tarefas'],
            ['Notas', '/app/notas'],
            ['Metas', '/app/metas'],
            ['Chats', '/app/chats'],
          ].map(([label, route]) => (
            <button key={route} className={`nav-item ${path === route ? 'active' : ''}`} onClick={() => navigate(route)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <p>Logado como</p>
          <strong>{currentUser.name}</strong>
          <small>{currentUser.email}</small>
          <button className="secondary-btn full" onClick={() => dispatch({ type: 'logout' })}>
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ODS 4 • Educação de Qualidade</p>
            <h1>SGT</h1>
          </div>
          <div className="topbar-meta">
            <span>{currentUser.name}</span>
            <button className="primary-btn" onClick={() => navigate('/app/dashboard')}>
              Dashboard
            </button>
          </div>
        </header>

        {path === '/app/dashboard' && <DashboardView tasks={tasks} subjects={subjects} grades={grades} goals={goals} />}
        {path === '/app/materias' && <SubjectsView navigate={navigate} />}
        {path === '/app/tarefas' && <TasksView />}
        {path === '/app/notas' && <GradesView />}
        {path === '/app/metas' && <GoalsView />}
        {path === '/app/chats' && <ChatsView groups={groups} />}
      </main>
    </div>
  );
}

function PublicShell({ path, navigate }) {
  const { dispatch, authError, currentUser } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const isRegister = path === '/cadastro';
  const isLogin = path === '/login';

  useEffect(() => {
    if (currentUser) navigate('/app/dashboard');
  }, [currentUser]);

  return (
    <div className="public-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Projeto TCC • ReactJS + Vite</p>
          <h1>SGT - Sistema de Gerenciamento de Tarefas e Organização Acadêmica</h1>
          <p>
            Uma plataforma para organizar matérias, tarefas, metas, notas e comunicação acadêmica em um único ambiente.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="secondary-btn" onClick={() => navigate('/cadastro')}>
              Cadastro
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <h2>Benefícios</h2>
          <ul>
            <li>Redução de atrasos e esquecimentos</li>
            <li>Planejamento semanal e metas visíveis</li>
            <li>Acompanhamento de produtividade e notas</li>
            <li>Organização para grupos de TCC</li>
          </ul>
        </div>
      </section>

      <section className="info-band">
        <div>
          <h2>ODS 4 - Educação de Qualidade</h2>
          <p>
            O SGT apoia autonomia, planejamento e aprendizagem contínua, com foco em organização acadêmica acessível.
          </p>
        </div>
        <div className="status-pill">Preparado para Vercel</div>
      </section>

      <section className="auth-grid">
        <div className="auth-card">
          <h2>{isRegister ? 'Criar conta' : 'Entrar'}</h2>
          {authError && <p className="error-box">{authError}</p>}

          {isRegister ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name || !form.email || !form.password || !form.confirmPassword) return alert('Preencha todos os campos.');
                if (!/^\S+@\S+\.\S+$/.test(form.email)) return alert('Informe um e-mail válido.');
                if (form.password.length < 8) return alert('A senha precisa ter no mínimo 8 caracteres.');
                if (form.password !== form.confirmPassword) return alert('As senhas não conferem.');
                dispatch({ type: 'register', payload: { name: form.name, email: form.email, password: form.password, remember } });
              }}
            >
              <Field label="Nome completo">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="E-mail">
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Senha">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Field>
              <Field label="Confirmar senha">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </Field>
              <Checkbox label="Mostrar senha" checked={showPassword} onChange={setShowPassword} />
              <Checkbox label="Lembrar usuário" checked={remember} onChange={setRemember} />
              <button className="primary-btn full" type="submit">
                Cadastrar
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                dispatch({ type: 'login', payload: { ...loginForm, remember } });
              }}
            >
              <Field label="E-mail">
                <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
              </Field>
              <Field label="Senha">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </Field>
              <Checkbox label="Mostrar senha" checked={showPassword} onChange={setShowPassword} />
              <Checkbox label="Lembrar usuário" checked={remember} onChange={setRemember} />
              <div className="link-row">
                <button type="button" className="link-btn" onClick={() => alert('Use demo@sgt.com e 12345678.')}>
                  Recuperação de acesso
                </button>
                <button type="button" className="link-btn" onClick={() => navigate('/cadastro')}>
                  Criar conta
                </button>
              </div>
              <button className="primary-btn full" type="submit">
                Entrar
              </button>
            </form>
          )}
        </div>

        <div className="auth-card auth-tip">
          <h2>Conta demo</h2>
          <p>Use `demo@sgt.com` e `12345678` para testar o sistema.</p>
          <p>Se quiser apenas apresentar o TCC, este seed já cobre a navegação principal e os indicadores.</p>
          <button className="secondary-btn full" onClick={() => navigate('/login')}>
            Ir para login
          </button>
        </div>
      </section>
    </div>
  );
}

function DashboardView({ tasks, subjects, grades, goals }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Concluída').length;
  const pendingTasks = tasks.filter((task) => task.status !== 'Concluída').length;
  const upcoming = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const average = grades.length ? grades.reduce((sum, grade) => sum + Number(grade.score), 0) / grades.length : 0;
  const goalProgress = goals.length ? Math.round(goals.reduce((sum, goal) => sum + Number(goal.progress), 0) / goals.length) : 0;
  const weeklyProductivity = [25, 40, 60, 55, 75, 80, 65];

  return (
    <div className="page-stack">
      <section className="stats-grid">
        {[
          ['Total de tarefas', totalTasks],
          ['Pendentes', pendingTasks],
          ['Concluídas', completedTasks],
          ['Média geral', average.toFixed(1)],
          ['Metas alcançadas', `${goalProgress}%`],
          ['Matérias', subjects.length],
        ].map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Próximos prazos</h2>
          <div className="list">
            {upcoming.map((task) => (
              <div className="list-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.description}</small>
                </div>
                <span>{task.dueDate}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Produtividade semanal</h2>
          <div className="bar-chart" aria-label="Produtividade semanal">
            {weeklyProductivity.map((value, index) => (
              <div className="bar-item" key={index}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${value}%` }} />
                </div>
                <small>{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][index]}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Desempenho acadêmico</h2>
          <div className="radial">
            <div className="radial-inner">
              <strong>{average.toFixed(1)}</strong>
              <span>média geral</span>
            </div>
          </div>
          <div className="list compact">
            {grades.slice(0, 3).map((grade) => (
              <div className="list-row" key={grade.id}>
                <strong>{grade.note}</strong>
                <span>{grade.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function SubjectsView() {
  const { subjects, currentUser, dispatch } = useApp();
  const [form, setForm] = useState({ id: '', name: '', teacher: '', color: '#2563eb', description: '' });
  const [query, setQuery] = useState('');
  const filtered = subjects.filter(
    (subject) =>
      subject.userId === currentUser.id &&
      [subject.name, subject.teacher, subject.description].some((field) => field.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="page-stack">
      <section className="split-panel">
        <article className="panel">
          <h2>{form.id ? 'Editar matéria' : 'Nova matéria'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.teacher) return alert('Nome e professor são obrigatórios.');
              dispatch({ type: 'upsertSubject', payload: { ...form, userId: currentUser.id } });
              setForm({ id: '', name: '', teacher: '', color: '#2563eb', description: '' });
            }}
          >
            <Field label="Nome">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Professor">
              <input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
            </Field>
            <Field label="Cor da disciplina">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <button className="primary-btn" type="submit">
              Salvar
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Pesquisar matéria</h2>
          <Field label="Busca">
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
          <div className="stack-list">
            {filtered.map((subject) => (
              <article className="data-card" key={subject.id}>
                <div className="data-card-head">
                  <div className="subject-badge" style={{ background: subject.color }} />
                  <div>
                    <strong>{subject.name}</strong>
                    <small>{subject.teacher}</small>
                  </div>
                </div>
                <p>{subject.description}</p>
                <div className="actions">
                  <button className="secondary-btn" onClick={() => setForm(subject)}>
                    Editar
                  </button>
                  <button className="danger-btn" onClick={() => dispatch({ type: 'deleteSubject', id: subject.id })}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function TasksView() {
  const { tasks, subjects, currentUser, dispatch } = useApp();
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    priority: 'Média',
    status: 'Pendente',
    dueDate: '',
    subjectId: subjects[0]?.id || '',
  });
  const [filter, setFilter] = useState('Todas');
  const filtered = tasks.filter((task) => task.userId === currentUser.id && (filter === 'Todas' || task.status === filter));

  return (
    <div className="page-stack">
      <section className="split-panel">
        <article className="panel">
          <h2>{form.id ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title || !form.dueDate) return alert('Título e prazo são obrigatórios.');
              dispatch({ type: 'upsertTask', payload: { ...form, userId: currentUser.id }, userId: currentUser.id });
              setForm({
                id: '',
                title: '',
                description: '',
                priority: 'Média',
                status: 'Pendente',
                dueDate: '',
                subjectId: subjects[0]?.id || '',
              });
            }}
          >
            <Field label="Título">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Matéria">
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="field-grid">
              <Field label="Prazo">
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </Field>
              <Field label="Prioridade">
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {['Baixa', 'Média', 'Alta', 'Urgente'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['Pendente', 'Em andamento', 'Concluída'].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <button className="primary-btn" type="submit">
              Salvar
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Tarefas</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {['Todas', 'Pendente', 'Em andamento', 'Concluída'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="stack-list">
            {filtered.map((task) => (
              <article className="data-card" key={task.id}>
                <div className="data-card-head">
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.priority} • {task.status}</small>
                  </div>
                  <span>{task.dueDate}</span>
                </div>
                <p>{task.description}</p>
                <div className="actions">
                  <button className="secondary-btn" onClick={() => setForm(task)}>
                    Editar
                  </button>
                  <button className="secondary-btn" onClick={() => dispatch({ type: 'toggleTask', id: task.id })}>
                    {task.status === 'Concluída' ? 'Reabrir' : 'Concluir'}
                  </button>
                  <button className="danger-btn" onClick={() => dispatch({ type: 'deleteTask', id: task.id })}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function GradesView() {
  const { grades, subjects, currentUser, dispatch } = useApp();
  const [form, setForm] = useState({ id: '', score: '', note: '', subjectId: subjects[0]?.id || '' });
  const ownGrades = grades.filter((grade) => grade.userId === currentUser.id);
  const average = ownGrades.length ? ownGrades.reduce((sum, grade) => sum + Number(grade.score), 0) / ownGrades.length : 0;

  const best = ownGrades.reduce((acc, grade) => (grade.score > (acc?.score || 0) ? grade : acc), null);
  const worst = ownGrades.reduce((acc, grade) => (grade.score < (acc?.score || 10) ? grade : acc), null);

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <article className="stat-card"><span>Média geral</span><strong>{average.toFixed(1)}</strong></article>
        <article className="stat-card"><span>Melhor disciplina</span><strong>{best ? best.note : '-'}</strong></article>
        <article className="stat-card"><span>Menor desempenho</span><strong>{worst ? worst.note : '-'}</strong></article>
      </section>

      <section className="split-panel">
        <article className="panel">
          <h2>{form.id ? 'Editar nota' : 'Registrar nota'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.score || !form.note) return alert('Preencha nota e observação.');
              dispatch({ type: 'upsertGrade', payload: { ...form, score: Number(form.score), userId: currentUser.id }, userId: currentUser.id });
              setForm({ id: '', score: '', note: '', subjectId: subjects[0]?.id || '' });
            }}
          >
            <Field label="Nota">
              <input type="number" step="0.1" min="0" max="10" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            </Field>
            <Field label="Observação">
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            <Field label="Matéria">
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </Field>
            <button className="primary-btn" type="submit">Salvar</button>
          </form>
        </article>

        <article className="panel">
          <h2>Histórico de avaliações</h2>
          <div className="stack-list">
            {ownGrades.map((grade) => (
              <article className="data-card" key={grade.id}>
                <div className="data-card-head">
                  <strong>{grade.note}</strong>
                  <span>{grade.score.toFixed(1)}</span>
                </div>
                <div className="actions">
                  <button className="secondary-btn" onClick={() => setForm(grade)}>Editar</button>
                  <button className="danger-btn" onClick={() => dispatch({ type: 'deleteGrade', id: grade.id })}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function GoalsView() {
  const { goals, currentUser, dispatch } = useApp();
  const [form, setForm] = useState({ id: '', title: '', description: '', progress: 0, period: 'Semanal' });
  const ownGoals = goals.filter((goal) => goal.userId === currentUser.id);

  return (
    <div className="page-stack">
      <section className="split-panel">
        <article className="panel">
          <h2>{form.id ? 'Editar meta' : 'Nova meta'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title) return alert('Título obrigatório.');
              dispatch({ type: 'upsertGoal', payload: { ...form, progress: Number(form.progress), userId: currentUser.id }, userId: currentUser.id });
              setForm({ id: '', title: '', description: '', progress: 0, period: 'Semanal' });
            }}
          >
            <Field label="Título">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="field-grid">
              <Field label="Progresso">
                <input type="range" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
              </Field>
              <Field label="Período">
                <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  {['Semanal', 'Mensal'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="primary-btn" type="submit">Salvar</button>
          </form>
        </article>

        <article className="panel">
          <h2>Acompanhamento de metas</h2>
          <div className="stack-list">
            {ownGoals.map((goal) => (
              <article className="data-card" key={goal.id}>
                <div className="data-card-head">
                  <strong>{goal.title}</strong>
                  <span>{goal.progress}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${goal.progress}%` }} /></div>
                <div className="actions">
                  <button className="secondary-btn" onClick={() => setForm(goal)}>Editar</button>
                  <button className="danger-btn" onClick={() => dispatch({ type: 'deleteGoal', id: goal.id })}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function ChatsView({ groups }) {
  const { messages, currentUser, dispatch } = useApp();
  const [text, setText] = useState('');
  const [groupForm, setGroupForm] = useState({ id: '', name: '', description: '', members: '' });

  return (
    <div className="page-stack">
      <section className="split-panel">
        <article className="panel">
          <h2>Chat acadêmico</h2>
          <div className="chat-window">
            {messages.map((message) => (
              <div className="chat-message" key={message.id}>
                <strong>{message.userName}</strong>
                <p>{message.text}</p>
                <small>{message.room} • {new Date(message.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              dispatch({
                type: 'addMessage',
                payload: { room: 'Turma', text, userName: currentUser.name, createdAt: new Date().toISOString(), userId: currentUser.id },
              });
              setText('');
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." />
            <button className="primary-btn" type="submit">Enviar</button>
          </form>
        </article>

        <article className="panel">
          <h2>Grupos de TCC</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!groupForm.name) return alert('Nome do grupo obrigatório.');
              dispatch({
                type: 'upsertGroup',
                payload: {
                  ...groupForm,
                  members: groupForm.members.split(',').map((item) => item.trim()).filter(Boolean),
                },
              });
              setGroupForm({ id: '', name: '', description: '', members: '' });
            }}
          >
            <Field label="Nome do grupo">
              <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea rows="3" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} />
            </Field>
            <Field label="Participantes">
              <input value={groupForm.members} onChange={(e) => setGroupForm({ ...groupForm, members: e.target.value })} placeholder="Nome 1, Nome 2" />
            </Field>
            <button className="primary-btn" type="submit">Salvar grupo</button>
          </form>
          <div className="stack-list">
            {groups.map((group) => (
              <article className="data-card" key={group.id}>
                <div className="data-card-head">
                  <strong>{group.name}</strong>
                </div>
                <p>{group.description}</p>
                <small>{group.members.join(', ')}</small>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
