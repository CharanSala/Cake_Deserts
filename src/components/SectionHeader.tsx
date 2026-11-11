interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  theme = 'light',
}: SectionHeaderProps) {
  const centered = align === 'center';
  const isDark = theme === 'dark';

  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-editorial ${
          isDark ? 'text-gold' : 'text-chocolate'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-[54px] ${
          isDark ? 'text-ivory' : 'text-espresso'
        }`}
      >
        {title}
      </h2>
      <div
        className={`mt-5 h-px w-20 bg-gold/70 ${centered ? 'mx-auto' : ''}`}
      />
      {subtitle && (
        <p
          className={`mt-5 text-base leading-relaxed sm:text-lg ${
            isDark ? 'text-ivory/75' : 'text-espresso/75'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
