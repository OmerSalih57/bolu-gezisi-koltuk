type PageHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function PageHeading({ eyebrow, title, description }: PageHeadingProps) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="text-sm font-medium text-teal-800">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-slate-600">{description}</p> : null}
    </header>
  )
}
