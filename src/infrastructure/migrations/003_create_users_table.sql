-- Migration 003: Usuários e Detalhes Bancários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  role user_role_enum NOT NULL DEFAULT 'EMPLOYEE',
  status user_status_enum NOT NULL DEFAULT 'ACTIVE',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_title VARCHAR(150),
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- Dados bancários incorporados (JSONB para flexibilidade e histórico)
  bank_details JSONB,
  
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adiciona Foreign Keys dos gestores nos departamentos
ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS fk_departments_manager,
  ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS fk_departments_director,
  ADD CONSTRAINT fk_departments_director FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE cost_centers
  DROP CONSTRAINT IF EXISTS fk_cost_centers_manager,
  ADD CONSTRAINT fk_cost_centers_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
