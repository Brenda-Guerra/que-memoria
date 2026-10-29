import type { CSSProperties, ReactNode } from 'react'

/** Ícone do jogo — mesmo desenho de app/icon.svg (favicon e atalhos). */
export function LogoIcone({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <svg
      className="logo-icone"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="116" fill="var(--yellow)" />
      <g stroke="var(--ink)" strokeWidth="20" strokeLinejoin="round">
        <rect x="106" y="210" width="200" height="200" rx="46" fill="var(--ink)" />
        <rect x="92" y="196" width="200" height="200" rx="46" fill="var(--blue)" />
        <rect x="218" y="112" width="200" height="200" rx="46" fill="var(--ink)" />
        <rect x="204" y="98" width="200" height="200" rx="46" fill="var(--pink)" />
      </g>
      <path
        d="M272 166a34 34 0 1 1 48 31c-11 6-16 12-16 27"
        fill="none"
        stroke="#fff"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <circle cx="304" cy="260" r="15" fill="#fff" />
    </svg>
  )
}

export function Logo({
  compacto = false,
}: {
  compacto?: boolean
}) {
  return (
    <div className={`logo ${compacto ? 'logo-compacto' : ''}`}>
      <LogoIcone tamanho={compacto ? 32 : 42} />
      <span className="logo-texto">
        Que <em>memória?</em>
      </span>
    </div>
  )
}

export function Avatar({
  nome,
  cor,
  tamanho = 'md',
  online,
}: {
  nome: string
  cor: string
  tamanho?: 'sm' | 'md' | 'lg'
  online?: boolean
}) {
  return (
    <span
      className={`avatar avatar-${tamanho}`}
      style={{ '--avatar': cor } as CSSProperties}
    >
      {nome.charAt(0).toUpperCase()}

      {online !== undefined && (
        <span
          className={`avatar-status ${online ? 'on' : 'off'}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  )
}

export function Aviso({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null

  return (
    <div className="aviso" role="status">
      {mensagem}
    </div>
  )
}

export function Modal({
  titulo,
  children,
  aoFechar,
  largo = false,
}: {
  titulo: string
  children: ReactNode
  aoFechar: () => void
  largo?: boolean
}) {
  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className={`modal ${largo ? 'modal-largo' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="modal-titulo">{titulo}</h3>
        {children}
      </div>
    </div>
  )
}

export function Carregando({ texto }: { texto: string }) {
  return (
    <main className="tela-centro">
      <div className="carregando">
        <div className="carregando-tiles">
          <span />
          <span />
          <span />
        </div>
        <p>{texto}</p>
      </div>
    </main>
  )
}
