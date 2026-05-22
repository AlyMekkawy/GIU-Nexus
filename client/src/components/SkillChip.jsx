/**
 * SkillChip – coloured pill that maps a skill to its AI / frontend / backend category.
 *
 * Props
 *   label   string  – skill name
 *   onRemove fn     – optional; renders an ✕ button when supplied
 */

const CATEGORY = {
  ai: ['llm', 'ai', 'machine learning', 'automation', 'nlp', 'deep learning', 'neural'],
  frontend: ['react', 'vue', 'angular', 'css', 'html', 'sass', 'ux', 'ui', 'figma', 'tailwind', 'typescript', 'javascript'],
};

function getCategory(label = '') {
  const l = label.toLowerCase();
  if (CATEGORY.ai.some(k => l.includes(k))) return 'ai';
  if (CATEGORY.frontend.some(k => l.includes(k))) return 'frontend';
  return 'backend';
}

const CHIP_STYLES = {
  ai:       { background: 'var(--cat-ai-bg)',       color: 'var(--cat-ai-text)'       },
  frontend: { background: 'var(--cat-frontend-bg)', color: 'var(--cat-frontend-text)' },
  backend:  { background: 'var(--cat-backend-bg)',  color: 'var(--cat-backend-text)'  },
};

function SkillChip({ label, onRemove }) {
  const cat = getCategory(label);
  const style = CHIP_STYLES[cat];

  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: '1.4',
        border: '1px solid rgba(0,0,0,0.08)',
        whiteSpace: 'nowrap',
      }}
    >
      {cat === 'ai' && (
        <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
      )}
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          title={`Remove ${label}`}
          style={{
            marginLeft: '2px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            padding: 0,
            lineHeight: 1,
            opacity: 0.6,
            fontSize: '16px',
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

export default SkillChip;
