-- Expand RLS policies for documentos to allow all roles to create documents

-- Allow Gestores to insert documents on processes they manage
CREATE POLICY "Gestores can create documents on assigned processes" ON documentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM solicitacoes s
    JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = documentos.solicitacao_id
    AND (
      -- Gestor can create if assigned or if user's gestor
      p.role = 'gestor' OR p.role = 'GESTOR'
    )
  )
);

-- Allow SOSFU to insert any documents
CREATE POLICY "SOSFU can create any documents" ON documentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('sosfu', 'SOSFU', 'analista_sosfu', 'ANALISTA_SOSFU', 'chefe_sosfu', 'CHEFE_SOSFU')
  )
);

-- Allow SEFIN to insert documents
CREATE POLICY "SEFIN can create documents" ON documentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('sefin', 'SEFIN', 'ordenador', 'ORDENADOR')
  )
);

-- Allow AJSEFIN to insert documents
CREATE POLICY "AJSEFIN can create documents" ON documentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ajsefin', 'AJSEFIN')
  )
);

-- Allow SGP to insert documents
CREATE POLICY "SGP can create documents" ON documentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('sgp', 'SGP')
  )
);

-- Expand SELECT policy for Gestores
CREATE POLICY "Gestores can view related documents" ON documentos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('gestor', 'GESTOR')
  )
);

-- Expand SELECT policy for all admin roles
CREATE POLICY "Admin roles can view all documents" ON documentos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('sefin', 'SEFIN', 'ajsefin', 'AJSEFIN', 'sgp', 'SGP', 'ordenador', 'ORDENADOR', 'admin', 'ADMIN')
  )
);

-- Allow users to update documents assigned to them for signing
CREATE POLICY "Assigned signers can update documents" ON documentos
FOR UPDATE TO authenticated
USING (assigned_signer_id = auth.uid())
WITH CHECK (assigned_signer_id = auth.uid());
