import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const STORAGE_KEY = 'sgt-state-v1';
const SESSION_KEY = 'sgt-session-v1';

const now = Date.now();
const daysFromNow = (days) => new Date(now + 86400000 * days).toISOString().slice(0, 10);

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
      dueDate: daysFromNow(2),
      subjectId: 'm1',
      userId: 'u1',
    },
    {
      id: 't2',
      title: 'Lista de SQL',
      description: 'Resolver exercícios de joins e consultas.',
      priority: 'Média',
      status: 'Pendente',
      dueDate: daysFromNow(4),
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

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value) {
  if (!value) return '-';
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return '-';
  return dateTimeFormatter.format(new Date(value));
}

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

function confirmDelete(message) {
  return typeof window !== 'undefined' && window.confirm(message);
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
        tasks: action.payload.id
          ? state.tasks.map((task) => (task.id === item.id ? item : task))
          : [...state.tasks, item],
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
        grades: action.payload.id
          ? state.grades.map((grade) => (grade.id === item.id ? item : grade))
          : [...state.grades, item],
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
        goals: action.payload.id
          ? state.goals.map((goal) => (goal.id === item.id ? item : goal))
          : [...state.goals, item],
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
        groups: action.payload.id
          ? state.groups.map((group) => (group.id === item.id ? item : group))
          : [...state.groups, item],
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
  const [appState, dispatchBase] = useReducer(
    (state, action) => {
      const authActions = ['register', 'login', 'logout', 'clearAuthError'];
      if (authActions.includes(action.type)) return authReducer(state, action);
      return dataReducer(state, action);
    },
    {
      ...loadState(),
      session: typeof window === 'undefined' ? null : JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null'),
      authError: null,
    },
  );
  const [toasts, setToasts] = useState([]);

  const notify = useMemo(
    () => (message, tone = 'info') => {
      const id = uid('toast');
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3600);
    },
    [],
  );

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
      notify,
      toasts,
    };
  }, [appState, notify, toasts]);

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
  const { currentUser, dispatch, tasks, subjects, grades, goals, messages, groups, toasts } = useApp();
  const [hash, navigate] = useHashRoute();
  const path = hash.replace(/^#/, '') || '/home';

  useEffect(() => {
    if (!currentUser && path.startsWith('/app')) navigate('/login');
  }, [currentUser, path, navigate]);

  useEffect(() => {
    if (currentUser && ['/home', '/login', '/cadastro'].includes(path)) navigate('/app/dashboard');
  }, [currentUser, path, navigate]);

  if (path === '/acesso') {
    return currentUser ? <AccessResultView mode="login" navigate={navigate} /> : <PublicShell path="/login" navigate={navigate} />;
  }

  if (path === '/cadastro-confirmado') {
    return currentUser ? <AccessResultView mode="register" navigate={navigate} /> : <PublicShell path="/login" navigate={navigate} />;
  }

  if (!currentUser) {
    return <PublicShell path={path} navigate={navigate} />;
  }

  const navItems = [
    ['Painel', '/app/dashboard'],
    ['Matérias', '/app/materias'],
    ['Tarefas', '/app/tarefas'],
    ['Notas', '/app/notas'],
    ['Metas', '/app/metas'],
    ['Chats', '/app/chats'],
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SGT</div>
          <div>
            <strong>Sistema de Gerenciamento</strong>
            <span>Tarefas e organização acadêmica</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map(([label, route]) => (
            <button
              key={route}
              type="button"
              className={`nav-item ${path === route ? 'active' : ''}`}
              aria-current={path === route ? 'page' : undefined}
              onClick={() => navigate(route)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p>Logado como</p>
          <strong>{currentUser.name}</strong>
          <small>{currentUser.email}</small>
          <button type="button" className="secondary-btn full" onClick={() => dispatch({ type: 'logout' })}>
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ODS 4 - Educação de Qualidade</p>
            <h1>SGT</h1>
          </div>
          <div className="topbar-meta">
            <span>{currentUser.name}</span>
            <button type="button" className="primary-btn" onClick={() => navigate('/app/dashboard')}>
              Dashboard
            </button>
          </div>
        </header>

        {path === '/app/dashboard' && (
          <DashboardView
            tasks={tasks}
            subjects={subjects}
            grades={grades}
            goals={goals}
            currentUser={currentUser}
            navigate={navigate}
          />
        )}
        {path === '/app/materias' && <SubjectsView />}
        {path === '/app/tarefas' && <TasksView />}
        {path === '/app/notas' && <GradesView />}
        {path === '/app/metas' && <GoalsView />}
        {path === '/app/chats' && <ChatsView groups={groups} />}
      </main>
      <ToastStack toasts={toasts} />
    </div>
  );
}

function PublicShell({ path, navigate }) {
  const { dispatch, authError, currentUser, notify, users } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const isRegister = path === '/cadastro';
  const isLogin = path === '/login';

  useEffect(() => {
    if (currentUser && ['/home', '/login', '/cadastro'].includes(path)) navigate('/app/dashboard');
  }, [currentUser, path, navigate]);

  return (
    <div className="public-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Projeto TCC - ReactJS + Vite</p>
          <h1>SGT - Sistema de Gerenciamento de Tarefas e Organização Acadêmica</h1>
          <p>
            Uma plataforma para organizar matérias, tarefas, metas, notas e comunicação acadêmica em um único ambiente.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={() => navigate('/login')}>
              Login
            </button>
            <button type="button" className="secondary-btn" onClick={() => navigate('/cadastro')}>
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
        <div className="status-pill">Pronto para apresentação</div>
      </section>

      <section className="auth-grid">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Acesso ao sistema">
            <button type="button" className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => navigate('/login')}>
              Entrar
            </button>
            <button type="button" className={`auth-tab ${isRegister ? 'active' : ''}`} onClick={() => navigate('/cadastro')}>
              Criar conta
            </button>
          </div>
          <div className="auth-header">
            <h2>{isRegister ? 'Criar conta' : 'Entrar'}</h2>
            <p>{isRegister ? 'Cadastre-se para salvar matérias, tarefas e metas.' : 'Use a conta demo ou acesse sua conta.'}</p>
          </div>
          {authError && <p className="error-box">{authError}</p>}

          {isRegister ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name || !form.email || !form.password || !form.confirmPassword) {
                  notify('Preencha todos os campos.', 'error');
                  return;
                }
                if (!/^\S+@\S+\.\S+$/.test(form.email)) {
                  notify('Informe um e-mail válido.', 'error');
                  return;
                }
                if (users.some((user) => user.email.toLowerCase() === form.email.toLowerCase())) {
                  notify('Esse e-mail já está cadastrado.', 'error');
                  return;
                }
                if (form.password.length < 8) {
                  notify('A senha precisa ter no mínimo 8 caracteres.', 'error');
                  return;
                }
                if (form.password !== form.confirmPassword) {
                  notify('As senhas não conferem.', 'error');
                  return;
                }
                dispatch({ type: 'register', payload: { name: form.name, email: form.email, password: form.password, remember } });
                notify('Conta criada com sucesso.', 'success');
                setForm({ name: '', email: '', password: '', confirmPassword: '' });
                navigate('/cadastro-confirmado');
              }}
            >
              <Field label="Nome completo">
                <input
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Senha">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Crie uma senha"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Field>
              <Field label="Confirmar senha">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
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
                navigate('/acesso');
              }}
            >
              <Field label="E-mail">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="demo@sgt.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </Field>
              <Field label="Senha">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </Field>
              <Checkbox label="Mostrar senha" checked={showPassword} onChange={setShowPassword} />
              <Checkbox label="Lembrar usuário" checked={remember} onChange={setRemember} />
              <div className="link-row">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => notify('Use demo@sgt.com e 12345678.', 'info')}
                >
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
          <div className="tip-list">
            <div className="tip-item">
              <strong>Acesso rápido</strong>
              <span>Sem cadastro inicial, você entra e já vê o painel completo.</span>
            </div>
            <div className="tip-item">
              <strong>Apresentação</strong>
              <span>Os dados seed mostram fluxo, métricas e navegação logo na primeira tela.</span>
            </div>
          </div>
          <button type="button" className="secondary-btn full" onClick={() => navigate('/login')}>
            Ir para login
          </button>
        </div>
      </section>
    </div>
  );
}

function DashboardView({ tasks, subjects, grades, goals, currentUser, navigate }) {
  const userTasks = tasks.filter((task) => task.userId === currentUser.id);
  const userGrades = grades.filter((grade) => grade.userId === currentUser.id);
  const userGoals = goals.filter((goal) => goal.userId === currentUser.id);
  const userSubjects = subjects.filter((subject) => subject.userId === currentUser.id);

  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((task) => task.status === 'Concluída').length;
  const pendingTasks = userTasks.filter((task) => task.status !== 'Concluída').length;
  const upcoming = [...userTasks]
    .filter((task) => task.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const nextTask = upcoming[0] || null;
  const average = userGrades.length ? userGrades.reduce((sum, grade) => sum + Number(grade.score), 0) / userGrades.length : 0;
  const goalProgress = userGoals.length ? Math.round(userGoals.reduce((sum, goal) => sum + Number(goal.progress), 0) / userGoals.length) : 0;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const weeklyProductivity = [25, 40, 60, 55, 75, 80, 65];
  const quickActions = [
    { label: 'Nova tarefa', route: '/app/tarefas' },
    { label: 'Nova matéria', route: '/app/materias' },
    { label: 'Abrir chat', route: '/app/chats' },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Painel"
        description="Visão geral rápida do que está pendente, concluído e do ritmo da semana."
        meta={[
          `${userTasks.length} tarefas`,
          `${userGrades.length} notas`,
          `${userGoals.length} metas`,
        ]}
      />
      <section className="dashboard-hero">
        <article className="dashboard-highlight">
          <p className="eyebrow">Foco de hoje</p>
          <h2>{nextTask ? nextTask.title : 'Sem tarefa urgente no momento'}</h2>
          <p>
            {nextTask
              ? `${nextTask.description || 'Tarefa sem descrição.'} Prazo em ${formatDate(nextTask.dueDate)}.`
              : 'Seu quadro está livre. Aproveite para cadastrar a próxima entrega.'}
          </p>
          <div className="badge-row">
            <span className="badge badge-em-andamento">{completionRate}% concluído</span>
            <span className="badge badge-subject">{userSubjects.length} matérias ativas</span>
            <span className="badge badge-média">{goalProgress}% das metas</span>
          </div>
        </article>

        <article className="dashboard-side">
          <div className="dashboard-side-card">
            <span>Próximo prazo</span>
            <strong>{nextTask ? formatDate(nextTask.dueDate) : '-'}</strong>
          </div>
          <div className="dashboard-side-card">
            <span>Taxa de conclusão</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="dashboard-actions">
            {quickActions.map((item) => (
              <button key={item.route} type="button" className="secondary-btn full" onClick={() => navigate(item.route)}>
                {item.label}
              </button>
            ))}
          </div>
        </article>
      </section>
      <section className="stats-grid">
        {[
          ['Total de tarefas', totalTasks],
          ['Pendentes', pendingTasks],
          ['Concluídas', completedTasks],
          ['Média geral', average.toFixed(1)],
          ['Metas alcançadas', `${goalProgress}%`],
          ['Matérias', userSubjects.length],
        ].map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head panel-head-stack">
            <div>
              <h2>Próximos prazos</h2>
              <p>Os três itens mais próximos de vencer aparecem primeiro.</p>
            </div>
          </div>
          <div className="list">
            {upcoming.length ? (
              upcoming.map((task) => {
                const subject = subjects.find((item) => item.id === task.subjectId);
                return (
                  <div className="list-row" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {subject ? `${subject.name} - ` : ''}
                        {task.description}
                      </small>
                    </div>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                );
              })
            ) : (
              <EmptyState title="Sem prazos por enquanto" description="Crie tarefas para acompanhar as próximas entregas." />
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head panel-head-stack">
            <div>
              <h2>Produtividade semanal</h2>
              <p>Indicador visual do ritmo da semana para facilitar a leitura rápida.</p>
            </div>
          </div>
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
          <div className="panel-head panel-head-stack">
            <div>
              <h2>Desempenho acadêmico</h2>
              <p>Média geral e últimas notas registradas no perfil atual.</p>
            </div>
          </div>
          <div className="radial">
            <div className="radial-inner">
              <strong>{average.toFixed(1)}</strong>
              <span>média geral</span>
            </div>
          </div>
          <div className="list compact">
            {userGrades.length ? (
              userGrades.slice(0, 3).map((grade) => (
                <div className="list-row" key={grade.id}>
                  <strong>{grade.note}</strong>
                  <span>{Number(grade.score).toFixed(1)}</span>
                </div>
              ))
            ) : (
              <EmptyState title="Sem notas registradas" description="Adicione avaliações para visualizar o desempenho." />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function SubjectsView() {
  const { subjects, currentUser, dispatch, notify } = useApp();
  const [form, setForm] = useState({ id: '', name: '', teacher: '', color: '#2563eb', description: '' });
  const [query, setQuery] = useState('');
  const ownSubjects = subjects.filter((subject) => subject.userId === currentUser.id);
  const filtered = ownSubjects.filter((subject) =>
    [subject.name, subject.teacher, subject.description].some((field) => field.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Matérias"
        description="Cadastre disciplinas, encontre conteúdos rapidamente e mantenha o contexto das atividades."
        meta={[
          `${ownSubjects.length} cadastradas`,
          filtered.length ? `${filtered.length} visíveis` : 'Sem resultados',
        ]}
      />
      <section className="subject-summary">
        <article className="summary-card">
          <span>Matérias ativas</span>
          <strong>{ownSubjects.length}</strong>
          <small>Organize os conteúdos por disciplina para facilitar o uso diário.</small>
        </article>
        <article className="summary-card">
          <span>Resultados da busca</span>
          <strong>{filtered.length}</strong>
          <small>Filtre por nome, professor ou descrição para localizar rápido.</small>
        </article>
        <article className="summary-card">
          <span>Próxima ação</span>
          <strong>{form.id ? 'Editar' : 'Criar'}</strong>
          <small>{form.id ? 'Você está ajustando uma matéria existente.' : 'Preencha o formulário para adicionar uma nova disciplina.'}</small>
        </article>
      </section>
      <section className="split-panel">
        <article className="panel">
          <div className="panel-head panel-head-stack">
            <div>
              <h2>{form.id ? 'Editar matéria' : 'Nova matéria'}</h2>
              <p>Use a cor da disciplina para identificar os cartões rapidamente.</p>
            </div>
            {form.id && (
              <button type="button" className="secondary-btn" onClick={() => setForm({ id: '', name: '', teacher: '', color: '#2563eb', description: '' })}>
                Cancelar edição
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name || !form.teacher) {
                notify('Nome e professor são obrigatórios.', 'error');
                return;
              }
              dispatch({ type: 'upsertSubject', payload: { ...form, userId: currentUser.id } });
              setForm({ id: '', name: '', teacher: '', color: '#2563eb', description: '' });
              notify(form.id ? 'Matéria atualizada.' : 'Matéria criada.', 'success');
            }}
          >
            <Field label="Nome">
              <input
                placeholder="Ex.: Desenvolvimento Web"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Professor">
              <input
                placeholder="Ex.: Prof. Ana Lima"
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              />
            </Field>
            <Field label="Cor da disciplina">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea
                rows="4"
                placeholder="Resumo breve da matéria"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <button className="primary-btn" type="submit">
              Salvar
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Pesquisar matéria</h2>
          <Field label="Busca">
            <input placeholder="Nome, professor ou descrição" value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
          <div className="stack-list">
            {filtered.length ? (
              filtered.map((subject) => (
                <article className="data-card" key={subject.id}>
                  <div className="data-card-head">
                    <div className="subject-head">
                      <div className="subject-badge" style={{ background: subject.color }} />
                      <div>
                        <strong>{subject.name}</strong>
                        <small>{subject.teacher}</small>
                      </div>
                    </div>
                    <span className="badge badge-subject">Cor {subject.color}</span>
                  </div>
                  <p>{subject.description || 'Sem descrição.'}</p>
                  <div className="actions">
                    <button type="button" className="secondary-btn" onClick={() => setForm(subject)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => {
                        if (!confirmDelete(`Excluir a matéria "${subject.name}"?`)) return;
                        dispatch({ type: 'deleteSubject', id: subject.id });
                        notify('Matéria excluída.', 'success');
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Nenhuma matéria encontrada" description="Tente outro termo ou crie uma nova disciplina." />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function TasksView() {
  const { tasks, subjects, currentUser, dispatch, notify } = useApp();
  const ownSubjects = subjects.filter((subject) => subject.userId === currentUser.id);
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    priority: 'Média',
    status: 'Pendente',
    dueDate: '',
    subjectId: ownSubjects[0]?.id || '',
  });
  const [filter, setFilter] = useState('Todas');
  const ownTasks = tasks.filter((task) => task.userId === currentUser.id);
  const filtered = ownTasks.filter((task) => filter === 'Todas' || task.status === filter);
  const taskStats = {
    Todas: ownTasks.length,
    Pendente: ownTasks.filter((task) => task.status === 'Pendente').length,
    'Em andamento': ownTasks.filter((task) => task.status === 'Em andamento').length,
    Concluída: ownTasks.filter((task) => task.status === 'Concluída').length,
  };

  useEffect(() => {
    if (!form.subjectId && ownSubjects[0]?.id) {
      setForm((current) => ({ ...current, subjectId: ownSubjects[0].id }));
    }
  }, [ownSubjects, form.subjectId]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Tarefas"
        description="Organize entregas por prazo, prioridade e status para reduzir ruído no dia a dia."
        meta={[
          `${ownTasks.length} no total`,
          `${filtered.length} no filtro atual`,
        ]}
      />
      <section className="split-panel">
        <article className="panel">
          <div className="panel-head panel-head-stack">
            <div>
              <h2>{form.id ? 'Editar tarefa' : 'Nova tarefa'}</h2>
              <p>Use prioridade e prazo para deixar a lista mais fácil de ler.</p>
            </div>
            {form.id && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setForm({
                    id: '',
                    title: '',
                    description: '',
                    priority: 'Média',
                    status: 'Pendente',
                    dueDate: '',
                    subjectId: ownSubjects[0]?.id || '',
                  })
                }
              >
                Cancelar edição
              </button>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title || !form.dueDate) {
                notify('Título e prazo são obrigatórios.', 'error');
                return;
              }
              dispatch({ type: 'upsertTask', payload: { ...form, userId: currentUser.id }, userId: currentUser.id });
              setForm({
                id: '',
                title: '',
                description: '',
                priority: 'Média',
                status: 'Pendente',
                dueDate: '',
                subjectId: ownSubjects[0]?.id || '',
              });
              notify(form.id ? 'Tarefa atualizada.' : 'Tarefa criada.', 'success');
            }}
          >
            <Field label="Título">
              <input
                placeholder="Ex.: Finalizar apresentação"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Descrição">
              <textarea
                rows="4"
                placeholder="Detalhe o que precisa ser feito"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Matéria">
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                {ownSubjects.length ? (
                  ownSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))
                ) : (
                  <option value="">Cadastre uma matéria primeiro</option>
                )}
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
          <div className="panel-head panel-head-stack">
            <div>
              <h2>Lista de tarefas</h2>
              <p>Filtre por situação ou acompanhe o volume de cada etapa rapidamente.</p>
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {['Todas', 'Pendente', 'Em andamento', 'Concluída'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="chip-row" role="tablist" aria-label="Filtros de tarefas">
            {['Todas', 'Pendente', 'Em andamento', 'Concluída'].map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-chip ${filter === item ? 'active' : ''}`}
                onClick={() => setFilter(item)}
              >
                {item}
                <span>{taskStats[item]}</span>
              </button>
            ))}
          </div>
          <div className="stack-list">
            {filtered.length ? (
              filtered.map((task) => {
                const subject = subjects.find((item) => item.id === task.subjectId);
                return (
                  <article className="data-card" key={task.id}>
                    <div className="data-card-head">
                      <div className="task-head">
                        <strong>{task.title}</strong>
                        <div className="badge-row">
                          <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                          <span className={`badge badge-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span>
                          {subject && <span className="badge badge-subject">{subject.name}</span>}
                        </div>
                      </div>
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                    <p>{task.description}</p>
                    <div className="actions">
                      <button type="button" className="secondary-btn" onClick={() => setForm(task)}>
                        Editar
                      </button>
                      <button type="button" className="secondary-btn" onClick={() => dispatch({ type: 'toggleTask', id: task.id })}>
                        {task.status === 'Concluída' ? 'Reabrir' : 'Concluir'}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => {
                          if (!confirmDelete(`Excluir a tarefa "${task.title}"?`)) return;
                          dispatch({ type: 'deleteTask', id: task.id });
                          notify('Tarefa excluída.', 'success');
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState title="Sem tarefas nesse filtro" description="Crie uma nova tarefa ou troque o filtro para ver resultados." />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function GradesView() {
  const { grades, subjects, currentUser, dispatch, notify } = useApp();
  const ownSubjects = subjects.filter((subject) => subject.userId === currentUser.id);
  const [form, setForm] = useState({ id: '', score: '', note: '', subjectId: ownSubjects[0]?.id || '' });
  const ownGrades = grades.filter((grade) => grade.userId === currentUser.id);
  const average = ownGrades.length ? ownGrades.reduce((sum, grade) => sum + Number(grade.score), 0) / ownGrades.length : 0;

  const best = ownGrades.reduce((acc, grade) => (grade.score > (acc?.score || 0) ? grade : acc), null);
  const worst = ownGrades.reduce((acc, grade) => (grade.score < (acc?.score || 10) ? grade : acc), null);

  useEffect(() => {
    if (!form.subjectId && ownSubjects[0]?.id) {
      setForm((current) => ({ ...current, subjectId: ownSubjects[0].id }));
    }
  }, [ownSubjects, form.subjectId]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Notas"
        description="Acompanhe desempenho, registre avaliações e identifique padrões com menos esforço."
        meta={[
          `${ownGrades.length} registros`,
          `Média ${average.toFixed(1)}`,
        ]}
      />
      <section className="stats-grid">
        <article className="stat-card">
          <span>Média geral</span>
          <strong>{average.toFixed(1)}</strong>
        </article>
        <article className="stat-card">
          <span>Melhor avaliação</span>
          <strong>{best ? best.note : '-'}</strong>
        </article>
        <article className="stat-card">
          <span>Menor desempenho</span>
          <strong>{worst ? worst.note : '-'}</strong>
        </article>
      </section>

      <section className="split-panel">
        <article className="panel">
          <h2>{form.id ? 'Editar nota' : 'Registrar nota'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.score || !form.note) {
                notify('Preencha nota e observação.', 'error');
                return;
              }
              dispatch({ type: 'upsertGrade', payload: { ...form, score: Number(form.score), userId: currentUser.id }, userId: currentUser.id });
              setForm({ id: '', score: '', note: '', subjectId: ownSubjects[0]?.id || '' });
              notify(form.id ? 'Nota atualizada.' : 'Nota registrada.', 'success');
            }}
          >
            <Field label="Nota">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
              />
            </Field>
            <Field label="Observação">
              <input placeholder="Ex.: Prova 1" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            <Field label="Matéria">
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                {ownSubjects.length ? (
                  ownSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))
                ) : (
                  <option value="">Cadastre uma matéria primeiro</option>
                )}
              </select>
            </Field>
            <button className="primary-btn" type="submit">
              Salvar
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Histórico de avaliações</h2>
          <div className="stack-list">
            {ownGrades.length ? (
              ownGrades.map((grade) => (
                <article className="data-card" key={grade.id}>
                  <div className="data-card-head">
                    <strong>{grade.note}</strong>
                    <span>{Number(grade.score).toFixed(1)}</span>
                  </div>
                  <div className="actions">
                    <button type="button" className="secondary-btn" onClick={() => setForm(grade)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => {
                        if (!confirmDelete(`Excluir a nota "${grade.note}"?`)) return;
                        dispatch({ type: 'deleteGrade', id: grade.id });
                        notify('Nota excluída.', 'success');
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Sem notas registradas" description="Cadastre a primeira avaliação para acompanhar o desempenho." />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function GoalsView() {
  const { goals, currentUser, dispatch, notify } = useApp();
  const [form, setForm] = useState({ id: '', title: '', description: '', progress: 0, period: 'Semanal' });
  const ownGoals = goals.filter((goal) => goal.userId === currentUser.id);

  return (
    <div className="page-stack">
      <PageHeader
        title="Metas"
        description="Transforme objetivos em progresso visível e acompanhe consistência ao longo do tempo."
        meta={[
          `${ownGoals.length} metas`,
          ownGoals.length ? `${Math.round(ownGoals.reduce((sum, goal) => sum + Number(goal.progress), 0) / ownGoals.length)}% média` : 'Sem média ainda',
        ]}
      />
      <section className="split-panel">
        <article className="panel">
          <h2>{form.id ? 'Editar meta' : 'Nova meta'}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title) {
                notify('Título obrigatório.', 'error');
                return;
              }
              dispatch({ type: 'upsertGoal', payload: { ...form, progress: Number(form.progress), userId: currentUser.id }, userId: currentUser.id });
              setForm({ id: '', title: '', description: '', progress: 0, period: 'Semanal' });
              notify(form.id ? 'Meta atualizada.' : 'Meta criada.', 'success');
            }}
          >
            <Field label="Título">
              <input placeholder="Ex.: Estudar 5 horas na semana" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea
                rows="4"
                placeholder="Descreva a meta e o foco"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="field-grid">
              <Field label="Progresso">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: e.target.value })}
                />
              </Field>
              <Field label="Período">
                <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  {['Semanal', 'Mensal'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="primary-btn" type="submit">
              Salvar
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Acompanhamento de metas</h2>
          <div className="stack-list">
            {ownGoals.length ? (
              ownGoals.map((goal) => (
                <article className="data-card" key={goal.id}>
                  <div className="data-card-head">
                    <strong>{goal.title}</strong>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <div className="actions">
                    <button type="button" className="secondary-btn" onClick={() => setForm(goal)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => {
                        if (!confirmDelete(`Excluir a meta "${goal.title}"?`)) return;
                        dispatch({ type: 'deleteGoal', id: goal.id });
                        notify('Meta excluída.', 'success');
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Sem metas cadastradas" description="Crie uma meta para acompanhar o progresso semanal ou mensal." />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function ChatsView({ groups }) {
  const { messages, currentUser, dispatch, notify } = useApp();
  const [activeRoom, setActiveRoom] = useState('Turma');
  const [text, setText] = useState('');
  const [groupForm, setGroupForm] = useState({ id: '', name: '', description: '', members: '' });
  const rooms = ['Turma', ...groups.map((group) => group.name)];
  const visibleMessages = messages.filter((message) => message.room === activeRoom);

  return (
    <div className="page-stack">
      <PageHeader
        title="Chats"
        description="Centralize mensagens e grupos do TCC para manter decisões e alinhamentos em um lugar só."
        meta={[
          `${messages.length} mensagens`,
          `${groups.length} grupos`,
        ]}
      />
      <section className="split-panel">
        <article className="panel">
          <div className="panel-head panel-head-stack">
            <div>
              <h2>Chat acadêmico</h2>
              <p>Escolha uma sala para manter a conversa contextualizada.</p>
            </div>
            <div className="room-chip-row" role="tablist" aria-label="Salas do chat">
              {rooms.map((room) => (
                <button
                  key={room}
                  type="button"
                  className={`room-chip ${activeRoom === room ? 'active' : ''}`}
                  onClick={() => setActiveRoom(room)}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
          <div className="chat-window">
            {visibleMessages.length ? (
              visibleMessages.map((message) => (
                <div className={`chat-message ${message.userId === currentUser.id ? 'mine' : ''}`} key={message.id}>
                  <div className="chat-message-head">
                    <strong>{message.userName}</strong>
                    <small>{formatDateTime(message.createdAt)}</small>
                  </div>
                  <p>{message.text}</p>
                  <small className="chat-room-label">{message.room}</small>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sem mensagens nessa sala"
                description="Troque de sala ou envie a primeira mensagem para iniciar o alinhamento."
              />
            )}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) {
                notify('Digite uma mensagem antes de enviar.', 'error');
                return;
              }
              dispatch({
                type: 'addMessage',
                payload: {
                  room: activeRoom,
                  text,
                  userName: currentUser.name,
                  createdAt: new Date().toISOString(),
                  userId: currentUser.id,
                },
              });
              setText('');
              notify(`Mensagem enviada em ${activeRoom}.`, 'success');
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Escreva em ${activeRoom}...`}
            />
            <button className="primary-btn" type="submit">
              Enviar
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-head panel-head-stack">
            <div>
              <h2>Grupos de TCC</h2>
              <p>Abra uma sala diretamente pelo grupo e veja os participantes.</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!groupForm.name) {
                notify('Nome do grupo obrigatório.', 'error');
                return;
              }
              dispatch({
                type: 'upsertGroup',
                payload: {
                  ...groupForm,
                  members: groupForm.members
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                },
              });
              setGroupForm({ id: '', name: '', description: '', members: '' });
              notify(groupForm.id ? 'Grupo atualizado.' : 'Grupo criado.', 'success');
            }}
          >
            <Field label="Nome do grupo">
              <input
                placeholder="Ex.: Grupo TCC Alpha"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />
            </Field>
            <Field label="Descrição">
              <textarea
                rows="3"
                placeholder="Objetivo do grupo"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
              />
            </Field>
            <Field label="Participantes">
              <input
                value={groupForm.members}
                onChange={(e) => setGroupForm({ ...groupForm, members: e.target.value })}
                placeholder="Nome 1, Nome 2"
              />
            </Field>
            <button className="primary-btn" type="submit">
              Salvar grupo
            </button>
          </form>
          <div className="stack-list">
            {groups.length ? (
              groups.map((group) => (
                <article className="data-card" key={group.id}>
                  <div className="data-card-head">
                    <div>
                      <strong>{group.name}</strong>
                      <small>{group.members.length} participantes</small>
                    </div>
                    <button type="button" className="secondary-btn" onClick={() => setActiveRoom(group.name)}>
                      Abrir chat
                    </button>
                  </div>
                  <p>{group.description}</p>
                  <small>{group.members.join(', ')}</small>
                </article>
              ))
            ) : (
              <EmptyState title="Sem grupos cadastrados" description="Monte equipes e organize os membros do TCC." />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function AccessResultView({ mode, navigate }) {
  const { currentUser, dispatch, notify } = useApp();
  const isRegister = mode === 'register';

  return (
    <div className="public-shell access-shell">
      <section className="access-panel">
        <p className="eyebrow">Acesso</p>
        <h1>{isRegister ? 'Cadastro conclu�do' : 'Acesso validado'}</h1>
        <p>
          {isRegister
            ? 'Sua conta foi criada. Volte para a tela inicial para entrar com o novo e-mail.'
            : 'Seu acesso foi confirmado. Siga para o painel do sistema.'}
        </p>

        <div className="access-card">
          <span>{currentUser?.name || 'Aluno Demo'}</span>
          <strong>{currentUser?.email || 'demo@sgt.com'}</strong>
        </div>

        <div className="actions access-actions">
          {isRegister ? (
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                dispatch({ type: 'logout' });
                notify('Fa�a login com sua nova conta.', 'info');
                navigate('/login');
              }}
            >
              Voltar para entrar
            </button>
          ) : (
            <button type="button" className="primary-btn" onClick={() => navigate('/app/dashboard')}>
              Entrar no painel
            </button>
          )}
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              dispatch({ type: 'logout' });
              navigate('/login');
            }}
          >
            Sair
          </button>
        </div>
      </section>
    </div>
  );
}
function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <span className="toast-dot" />
          <p>{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

function PageHeader({ title, description, meta }) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">{title}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="page-meta">
        {meta.map((item) => (
          <span key={item} className="meta-chip">
            {item}
          </span>
        ))}
      </div>
    </section>
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

