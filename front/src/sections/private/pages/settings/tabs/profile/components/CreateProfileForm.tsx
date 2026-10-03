import { useState } from 'react';
import style from '../ProfilesTab.module.css';
import type { AccessRuleTree } from '../ProfilesTab';
import { useCallApi } from '../../../../../../../hooks/useCallApi';
import AlertInitium from '../../../../../../transversal/ui/Alert/Alert';

interface CreateProfileFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  rules: AccessRuleTree[];
}

export default function CreateProfileForm({ onSuccess, onCancel, rules }: CreateProfileFormProps) {
  const { fetcher } = useCallApi();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Helpers para recoger todas las keys hijas de un nodo ---
  function getAllChildKeys(node: AccessRuleTree): string[] {
    const keys: string[] = [];
    for (const child of node.children) {
      keys.push(child.key);
      keys.push(...getAllChildKeys(child));
    }
    return keys;
  }

  // --- Toggle padre: solo se selecciona/deselecciona a sí mismo ---
  // Al deseleccionar padre, también se quitan los hijos (no pueden existir sin padre)
  function toggleParent(node: AccessRuleTree) {
    const next = new Set(selectedKeys);
    const nextExpanded = new Set(expandedParents);

    if (next.has(node.key)) {
      // Deseleccionar padre → quitar también todos los hijos y colapsar
      next.delete(node.key);
      getAllChildKeys(node).forEach((k) => next.delete(k));
      nextExpanded.delete(node.id);
    } else {
      // Seleccionar solo el padre y expandir hijos
      next.add(node.key);
      if (node.children.length > 0) {
        nextExpanded.add(node.id);
      }
    }

    setSelectedKeys(next);
    setExpandedParents(nextExpanded);
  }

  // --- Toggle hijo: selecciona/deselecciona hijo, siempre agrega el padre ---
  function toggleChild(child: AccessRuleTree, parentKey: string) {
    const next = new Set(selectedKeys);

    if (next.has(child.key)) {
      // Deseleccionar hijo y sus sub-hijos
      next.delete(child.key);
      getAllChildKeys(child).forEach((k) => next.delete(k));
    } else {
      // Seleccionar hijo + asegurar que padre esté incluido
      next.add(child.key);
      next.add(parentKey);
    }

    setSelectedKeys(next);
  }

  // --- Expand/collapse hijos ---
  function toggleExpand(nodeId: number) {
    const next = new Set(expandedParents);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setExpandedParents(next);
  }

  // --- Render recursivo de un nodo del árbol (soporta N niveles) ---
  function renderNode(node: AccessRuleTree, parentKey: string | null, depth: number) {
    const hasChildren = node.children.length > 0;
    const expanded = expandedParents.has(node.id);

    return (
      <div
        key={node.id}
        className={style.ruleParent}
        style={depth > 0 ? { marginLeft: '1.25rem' } : undefined}
      >
        <div className={style.ruleParentRow}>
          {hasChildren && (
            <button
              type="button"
              className={style.expandBtn}
              onClick={() => toggleExpand(node.id)}
              aria-label={expanded ? 'Colapsar' : 'Expandir'}
            >
              {expanded ? '▾' : '▸'}
            </button>
          )}
          <label className={style.ruleCheckLabel}>
            <input
              type="checkbox"
              checked={selectedKeys.has(node.key)}
              onChange={() => (parentKey ? toggleChild(node, parentKey) : toggleParent(node))}
            />
            <span className={style.ruleName}>{node.descripcion}</span>
          </label>
        </div>

        {hasChildren && expanded && (
          <div className={style.ruleChildren}>
            {node.children.map((child) => renderNode(child, node.key, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  function renderTree(tree: AccessRuleTree[]) {
    return (
      <div className={style.rulesTree}>
        {tree.map((node) => renderNode(node, null, 0))}
      </div>
    );
  }

  // --- Validación ---
  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del perfil es obligatorio';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Debe tener al menos 3 caracteres';
    }

    if (description.trim().length > 200) {
      newErrors.description = 'Máximo 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/profiles',
        method: 'POST',
        body: {
          name: name.trim(),
          description: description.trim(),
          accessKeys: Array.from(selectedKeys),
        },
      });
      onSuccess();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string }; status?: number };
      if (errorData?.status && errorData.status >= 400 && errorData.status < 500 && errorData?.data?.message) {
        setErrorMsg(errorData.data.message);
      } else {
        setErrorMsg('Ocurrió un error al crear el perfil. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <AlertInitium variant="error" title="Error" message={errorMsg} />}

      <div className={style.formGroup}>
        <label htmlFor="profileName">Nombre del perfil</label>
        <input
          id="profileName"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Ej: Veterinario, Auxiliar, Recepcionista..."
          autoFocus
        />
        {errors.name && <span className={style.fieldError}>{errors.name}</span>}
      </div>

      <div className={style.formGroup}>
        <label htmlFor="profileDesc">Descripción (opcional)</label>
        <textarea
          id="profileDesc"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Breve descripción de las responsabilidades de este perfil..."
          rows={3}
        />
        {errors.description && <span className={style.fieldError}>{errors.description}</span>}
      </div>

      {/* Permisos (accesos de sucursal) */}
      <div className={style.formGroup}>
        <label>Permisos</label>
        {rules.length > 0 ? renderTree(rules) : (
          <p className={style.emptyRules}>No hay accesos de sucursal disponibles.</p>
        )}
      </div>

      <div className={style.modalActions}>
        <button type="button" className={style.btnCancel} onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className={style.btnPrimary} disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
